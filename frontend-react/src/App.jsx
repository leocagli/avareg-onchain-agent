import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import './App.css';

const API_URL = "http://localhost:3001";
const RISK_ORACLE_ABI = ["function recordRiskScore(address user, uint8 riskScore, bytes signature) public"];

function App() {
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy();

  // Estados de la Aplicación
  const [activeTab, setActiveTab] = useState("marketplace");
  const [profileComplete, setProfileComplete] = useState(false);
  const [kycForm, setKycForm] = useState({ wallet: "", country: "Mexico" });
  const [riskState, setRiskState] = useState({ score: null, suspicious: false, reason: "", reportHash: "", analysisId: "" });
  const [wavyStatus, setWavyStatus] = useState("Esperando escaneo...");
  const [txHash, setTxHash] = useState(null);
  const [referralStatus, setReferralStatus] = useState("Waiting");
  const [events, setEvents] = useState([]);
  const [agentSignature, setAgentSignature] = useState(null);
  const [riskOracleAddress, setRiskOracleAddress] = useState("");
  const [scanWallet, setScanWallet] = useState("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
  const [transferState, setTransferState] = useState({ result: "Pending", reason: "ComplianceModule no llamado" });

  // Cargar configuración inicial (Dirección del Oracle desde el Backend)
  useEffect(() => {
    fetch(`${API_URL}/api/wavy/config`)
      .then(res => res.json())
      .then(data => {
        if (data.riskOracleAddress) setRiskOracleAddress(data.riskOracleAddress);
      }).catch(err => console.error(err));
  }, []);

  // Lógica de Auditoría (Logs)
  const addEvent = (type, text) => {
    setEvents(prev => [{ type, text, at: new Date().toLocaleTimeString() }, ...prev]);
  };

  // Lógica de Evaluación (Reglas Exclusivas de México: score máximo 59)
  const evaluate = () => {
    if (!profileComplete) return ["Not evaluated", "INVESTOR_PROFILE_REQUIRED"];
    if (riskState.score === null) return ["Review", "WAVY_SCORE_MISSING"];
    if (riskState.suspicious) return ["Blocked", "SUSPICIOUS_ACTIVITY"];
    if (riskState.score > 59) return ["Blocked", "WAVY_SCORE_TOO_HIGH"]; // Límite de México
    if (riskState.score >= 40) return ["Review", "MANUAL_REVIEW_REQUIRED"];
    return ["Allowed", "ELIGIBLE"];
  };

  const [decision, reason] = evaluate();

  // 1. Guardar KYC en MongoDB
  const submitKyc = async () => {
    if (!kycForm.wallet) return alert("Por favor ingresa la wallet");
    setWavyStatus("Guardando en Base de Datos...");
    try {
      await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: kycForm.wallet, country: kycForm.country })
      });
      setProfileComplete(true);
      addEvent("approved", `Perfil de Inversor guardado en BD local para México.`);
    } catch (error) {
      console.error(error);
    }
  };

  // 2. Escanear Wallet en Wavy y Firmar en el Backend
  const scanWavy = async () => {
    setWavyStatus("Consultando a Wavy Node...");
    try {
      const response = await fetch(`${API_URL}/api/wavy/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: scanWallet, description: `AvaReg Mexico IFC investor` })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "WAVY_SCAN_FAILED");

      setWavyStatus("Obteniendo firma segura del Agente On-Chain...");
      
      // Obtenemos el JWT real de Privy para enviarlo al backend
      const token = await getAccessToken();
      const agentRes = await fetch(`${API_URL}/api/attest-risk`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ userAddress: scanWallet, riskScore: payload.risk.riskScore })
      });
      
      const agentPayload = await agentRes.json();
      if (agentPayload.success) {
        setAgentSignature(agentPayload.signature);
      } else {
        throw new Error(agentPayload.error);
      }

      setRiskState({
        score: Number(payload.risk.riskScore),
        suspicious: Boolean(payload.risk.suspiciousActivity),
        reason: payload.risk.riskReason || "",
        analysisId: payload.risk.analysisId || null,
        reportHash: payload.risk.reportHash || null
      });
      setWavyStatus(`Análisis de Wavy completado.`);
      addEvent("review", `Wavy devolvió un score de ${payload.risk.riskScore}/100.`);
    } catch (error) {
      setWavyStatus(`Escaneo fallido: ${error.message}`);
      addEvent("blocked", `Escaneo fallido: ${error.message}.`);
    }
  };

  // 3. Enviar a Avalanche Fuji
  const requestAccess = async () => {
    if (!window.ethereum) return alert("Por favor, instala Core Wallet o MetaMask.");
    if (riskState.score === null || !agentSignature) return alert("Primero debes escanear la wallet.");
    if (!riskOracleAddress) return alert("Falta configurar RISK_ORACLE_ADDRESS en el .env del servidor.");

    if (decision === "Blocked") {
       setReferralStatus("REJECTED");
       return addEvent("blocked", "Referral bloqueado: Actividad sospechosa o riesgo muy alto.");
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(riskOracleAddress, RISK_ORACLE_ABI, signer);

      addEvent("review", "Firma solicitada en tu wallet (Core/MetaMask)...");
      const tx = await contract.recordRiskScore(scanWallet, riskState.score, agentSignature);

      addEvent("review", `Transacción enviada a Fuji. Esperando confirmación...`);
      const receipt = await tx.wait();

      setTxHash(receipt.hash);
      setReferralStatus("ROUTED");
      addEvent("approved", `✅ Éxito: RiskScore guardado on-chain en el bloque ${receipt.blockNumber}`);
    } catch (error) {
      console.error(error);
      setReferralStatus("REJECTED");
      addEvent("blocked", `Transacción fallida: ${error.message}`);
    }
  };

  // 4. Mercado Secundario
  const transferCheck = () => {
     if (decision === "Allowed") {
       setTransferState({ result: "Executed", reason: reason });
       addEvent("approved", "Secondary transfer executed.");
     } else {
       setTransferState({ result: decision === "Review" ? "Pending review" : "Blocked", reason: reason });
       addEvent(decision === "Review" ? "review" : "blocked", `Transferencia ${decision.toLowerCase()}: ${reason}.`);
     }
  };

  // Esperar a que Privy cargue en el navegador
  if (!ready) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8f9fa', color: '#333' }}>
        <h2>Cargando entorno seguro...</h2>
      </div>
    );
  }

  // Pantalla de Login (Si no está autenticado)
  if (!authenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', color: '#333', fontFamily: 'sans-serif' }}>
         <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>AvaReg</h1>
         <p style={{ fontSize: '1.2rem', marginBottom: '30px', color: '#636e72' }}>México IFC - Portal de Distribución Regulada</p>
         <button onClick={login} style={{ padding: '15px 30px', fontSize: '18px', background: '#6c5ce7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
           Iniciar Sesión Seguro (Privy)
         </button>
      </div>
    )
  }

  // Simulación de la respuesta de una API B2B de Arkangeles (Mock Data)
  const mockEquities = [
    { id: 1, name: "FintechMex S.A.P.I.", type: "Equity (Capital)", target: "$10,000,000 MXN", minTicket: "$3,000 MXN", progress: "85%", logo: "🚀" },
    { id: 2, name: "AgroTech Latam", type: "Deuda Convertible", target: "$5,000,000 MXN", minTicket: "$1,500 MXN", progress: "42%", logo: "🌱" }
  ];

  // Dashboard Principal
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif', color: '#333' }}>
      {/* Sidebar Lateral */}
      <aside style={{ width: '250px', background: '#2d3436', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: 'white', marginBottom: '30px' }}>AvaReg (MX)</h2>
        {["marketplace", "profile", "risk", "referral", "secondary", "dashboard"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: activeTab === tab ? '#6c5ce7' : 'transparent', color: 'white', border: 'none', padding: '12px', textAlign: 'left', borderRadius: '5px', marginBottom: '10px', cursor: 'pointer', textTransform: 'capitalize', fontSize: '16px' }}>
            {tab}
          </button>
        ))}
        <div style={{ marginTop: 'auto', borderTop: '1px solid #636e72', paddingTop: '20px' }}>
           <small style={{display: 'block', marginBottom:'10px', wordBreak: 'break-all'}}>User: {user.email?.address || user.wallet?.address}</small>
           <button onClick={logout} style={{ width: '100%', background: '#d63031', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer' }}>Cerrar Sesión</button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main style={{ flex: 1, padding: '40px', background: '#f8f9fa' }}>
         
         {/* Resumen Superior */}
         <div style={{ display: 'flex', justifyContent: 'space-between', background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
            <div><small>Producto</small><h3 style={{margin: '5px 0'}}>Mexico IFC</h3></div>
            <div><small>Wavy Score</small><h3 style={{ margin: '5px 0', color: riskState.score >= 60 ? '#d63031' : '#00b894' }}>{riskState.score === null ? "Sin Escanear" : `${riskState.score}/100`}</h3></div>
            <div><small>Decisión</small><h3 style={{ margin: '5px 0', color: decision === "Allowed" ? '#00b894' : decision === "Review" ? '#fdcb6e' : '#d63031' }}>{decision}</h3></div>
         </div>

         {/* Panel Dinámico según la pestaña activa */}
         <div style={{ background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            {activeTab === "marketplace" && (
              <div>
                <h2>Marketplace (México)</h2>
                <p style={{ color: '#636e72', marginBottom: '20px' }}>
                  Oportunidades de inversión simuladas (Ruta IFC tipo Arkangeles). 
                  Requieren <strong>Wavy Score 0-59</strong> y validación On-Chain en Avalanche.
                </p>
                
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  {mockEquities.map(equity => (
                    <div key={equity.id} style={{ flex: '1 1 300px', border: '1px solid #dfe6e9', padding: '20px', borderRadius: '10px', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>{equity.logo} {equity.name}</h3>
                        <small style={{ background: '#e8f8f5', color: '#00b894', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{equity.type}</small>
                      </div>
                      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '15px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ color: '#636e72' }}>Meta:</span> <strong>{equity.target}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <span style={{ color: '#636e72' }}>Ticket Mínimo:</span> <strong>{equity.minTicket}</strong>
                      </div>
                      <div style={{ background: '#eee', height: '8px', borderRadius: '4px', overflow: 'hidden' }}><div style={{ background: '#6c5ce7', width: equity.progress, height: '100%' }}></div></div>
                      <small style={{ display: 'block', textAlign: 'right', marginTop: '5px', color: '#6c5ce7', fontWeight: 'bold' }}>{equity.progress} Fondeado</small>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div>
                <h2>Perfil del Inversor (KYC)</h2>
                {profileComplete ? (
                  <div style={{ padding: '20px', background: '#e8f8f5', color: '#00b894', borderRadius: '10px', marginTop: '20px' }}>✅ Perfil de Inversor guardado en Base de Datos.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px', marginTop: '20px' }}>
                    <label>Wallet Address</label><input value={kycForm.wallet} onChange={e => setKycForm({...kycForm, wallet: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                    <label>País</label><input value={kycForm.country} disabled style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', background: '#eee' }} />
                    <button onClick={submitKyc} style={{ padding: '10px', background: '#0984e3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Verificar KYC</button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "risk" && (
              <div>
                <h2>Wavy Risk Gate</h2>
                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                  <input value={scanWallet} onChange={e => setScanWallet(e.target.value)} style={{ padding: '10px', width: '350px', borderRadius: '5px', border: '1px solid #ccc' }} />
                  <button onClick={scanWavy} style={{ padding: '10px 20px', background: '#e17055', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Run Wavy Scan</button>
                </div>
                <p style={{ marginTop: '20px', padding: '10px', background: '#f1f2f6', borderRadius: '5px' }}>{wavyStatus}</p>
                {riskState.score !== null && (
                  <div style={{ marginTop: '20px', padding: '15px', borderLeft: `5px solid ${riskState.score >= 60 ? 'red' : 'green'}`, background: '#fdfdfd' }}>
                    <strong>Score Real:</strong> {riskState.score}/100 <br/>
                    <strong>Razón de Wavy:</strong> {riskState.reason}
                  </div>
                )}
              </div>
            )}

            {activeTab === "referral" && (
              <div>
                <h2>Referral a Institución Regulada</h2>
                <button onClick={requestAccess} style={{ padding: '10px 20px', background: '#00b894', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}>Guardar en Avalanche Fuji</button>
                <div style={{ background: '#f1f2f6', padding: '20px', borderRadius: '10px' }}>
                   <p><strong>Status:</strong> {referralStatus}</p>
                   <p><strong>Tx Hash:</strong> {txHash || "Sin enviar"}</p>
                </div>
              </div>
            )}

            {activeTab === "secondary" && (
              <div>
                <h2>Mercado Secundario (Transferencia)</h2>
                <button onClick={transferCheck} style={{ padding: '10px 20px', background: '#0984e3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}>Simular transferencia a esta wallet</button>
                <div style={{ background: '#f1f2f6', padding: '20px', borderRadius: '10px' }}>
                   <p><strong>Resultado:</strong> {transferState.result} ({transferState.reason})</p>
                </div>
              </div>
            )}

            {activeTab === "dashboard" && (
              <div>
                <h2>Eventos y Auditoría</h2>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {events.map((ev, i) => (
                    <li key={i} style={{ padding: '10px', borderBottom: '1px solid #eee', color: ev.type === 'blocked' ? 'red' : '#333' }}>
                      <small style={{ color: '#aaa', marginRight: '10px' }}>{ev.at}</small>{ev.text}
                    </li>
                  ))}
                  {events.length === 0 && <p>No hay eventos registrados aún.</p>}
                </ul>
              </div>
            )}
         </div>
      </main>
    </div>
  );
}

export default App;
