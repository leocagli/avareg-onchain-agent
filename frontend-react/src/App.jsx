import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import './App.css';
import logo from '../images/logo.jpg';

const API_URL = "http://localhost:3001";
const RISK_ORACLE_ABI = ["function recordRiskScore(address user, uint8 riskScore, bytes signature) public"];

// --- COMPONENTE: Modal de Inversión Fintech ---
const InvestmentModal = ({ equity, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState("");
  const [loadingText, setLoadingText] = useState("Creando Cofre de Inversión...");
  
  // Extraer el monto mínimo de la startup y controlar el estado del input
  const minAmount = equity ? parseFloat(equity.minTicket.replace(/[^0-9.]/g, '')) : 0;
  const [amount, setAmount] = useState(minAmount);

  useEffect(() => {
    if (pin.length === 4) {
      setStep(3);
      setTimeout(() => {
        setLoadingText("Verificando con Wavy...");
        setTimeout(() => onSuccess(amount), 1500);
      }, 1500);
    }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handleKey = (key) => {
    if (key === 'del') setPin(pin.slice(0, -1));
    else if (pin.length < 4) setPin(pin + key);
  };

  if (!equity) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '1.5rem', padding: '2rem', maxWidth: '380px', width: '90%', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        {step !== 3 && <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '1.5rem', cursor: 'pointer', transition: 'color 0.2s' }}>×</button>}
        
        {step === 1 && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease-in-out' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.5rem 0' }}>Confirmar Inversión</h3>
            <p style={{ color: '#6b7280', margin: '0 0 1.5rem 0', fontSize: '0.95rem' }}>Estás a punto de invertir en <strong>{equity.name}</strong></p>
            
            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#374151', fontWeight: 'bold', marginBottom: '8px' }}>Monto a invertir (MXN)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '12px', fontSize: '1.2rem', color: '#6b7280' }}>$</span>
                <input 
                  type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={minAmount}
                  style={{ width: '100%', padding: '12px 12px 12px 30px', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', boxSizing: 'border-box', color: '#111827', fontWeight: 'bold' }} 
                />
              </div>
              {amount < minAmount && <small style={{ color: '#d63031', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>El mínimo es ${minAmount.toLocaleString()}</small>}
            </div>

            <button disabled={amount < minAmount} onClick={() => setStep(2)} style={{ width: '100%', padding: '14px', backgroundColor: amount >= minAmount ? '#4f46e5' : '#9ca3af', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 'bold', cursor: amount >= minAmount ? 'pointer' : 'not-allowed', fontSize: '1.05rem', transition: 'background 0.2s' }}>Continuar</button>
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease-in-out' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.5rem 0' }}>Ingresa tu PIN</h3>
            <p style={{ color: '#6b7280', margin: '0 0 2rem 0', fontSize: '0.95rem' }}>Clave de seguridad de 4 dígitos</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: i < pin.length ? '#111827' : '#e5e7eb', transition: 'background-color 0.2s' }} />
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', maxWidth: '240px', margin: '0 auto' }}>
              {[1,2,3,4,5,6,7,8,9].map(num => (
                <button key={num} onClick={() => handleKey(num.toString())} style={{ padding: '1rem', fontSize: '1.25rem', fontWeight: 'bold', borderRadius: '50%', border: 'none', backgroundColor: '#f9fafb', color: '#374151', cursor: 'pointer', transition: 'background 0.1s' }}>{num}</button>
              ))}
              <div></div>
              <button onClick={() => handleKey('0')} style={{ padding: '1rem', fontSize: '1.25rem', fontWeight: 'bold', borderRadius: '50%', border: 'none', backgroundColor: '#f9fafb', color: '#374151', cursor: 'pointer' }}>0</button>
              <button onClick={() => handleKey('del')} style={{ padding: '1rem', fontSize: '1rem', fontWeight: 'bold', borderRadius: '50%', border: 'none', backgroundColor: '#f9fafb', color: '#6b7280', cursor: 'pointer' }}>⌫</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '2rem 0', animation: 'fadeIn 0.3s ease-in-out' }}>
            <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTopColor: '#4f46e5', borderRadius: '50%', margin: '0 auto 1.5rem auto', animation: 'spin 1s linear infinite' }}></div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.5rem 0' }}>{loadingText}</h3>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.95rem' }}>No cierres esta pantalla</p>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

// --- COMPONENTE: Perfil del Inversor Institucional ---
const UserProfile = ({ userEmail }) => {
  const styles = {
    card: {
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      padding: '32px',
      fontFamily: 'sans-serif',
      border: '1px solid #f0f0f0'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      marginBottom: '24px'
    },
    avatar: {
      width: '64px',
      height: '64px',
      borderRadius: '50%',
      backgroundColor: '#f3f4f6',
      color: '#374151',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      fontWeight: 'bold',
      border: '1px solid #e5e7eb',
      textTransform: 'uppercase'
    },
    infoContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    },
    email: {
      margin: 0,
      color: '#333333',
      fontSize: '1.125rem',
      fontWeight: '600'
    },
    badge: {
      backgroundColor: '#ecfdf5',
      color: '#064e3b',
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      width: 'fit-content'
    },
    divider: {
      border: 'none',
      borderTop: '1px solid #eeeeee',
      margin: '0 0 24px 0'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px'
    },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
    label: { color: '#666666', fontSize: '0.875rem', fontWeight: '500', margin: 0 },
    value: { color: '#333333', fontSize: '1rem', fontWeight: '600', margin: 0 }
  };

  const initial = userEmail ? userEmail.charAt(0) : 'U';

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.avatar}>{initial}</div>
        <div style={styles.infoContainer}>
          <h3 style={styles.email}>{userEmail || "usuario@ejemplo.com"}</h3>
          <span style={styles.badge}>✅ Identidad Verificada por Google</span>
        </div>
      </div>
      <hr style={styles.divider} />
      <div style={styles.grid}>
        <div style={styles.fieldGroup}>
          <p style={styles.label}>Nivel de Riesgo Autorizado</p>
          <p style={styles.value}>Moderado / Medio</p>
        </div>
        <div style={styles.fieldGroup}>
          <p style={styles.label}>Origen de Fondos</p>
          <p style={styles.value}>Salario / Ahorros</p>
        </div>
        <div style={styles.fieldGroup}>
          <p style={styles.label}>Límite Mensual de Inversión</p>
          <p style={styles.value}>$50,000 MXN</p>
        </div>
        <div style={styles.fieldGroup}>
          <p style={styles.label}>Estado Regulatorio (KYC)</p>
          <p style={{...styles.value, color: '#059669'}}>Aprobado</p>
        </div>
      </div>
    </div>
  );
};

function App() {
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy();

  // Estados de la Aplicación
  const [activeTab, setActiveTab] = useState("marketplace");
  const [profileComplete, setProfileComplete] = useState(false);
  const [kycForm, setKycForm] = useState({ wallet: "", country: "Mexico", fullName: "", investorType: "Minorista" });
  const [riskState, setRiskState] = useState({ score: null, suspicious: false, reason: "", reportHash: "", analysisId: "" });
  const [wavyStatus, setWavyStatus] = useState("Esperando escaneo...");
  const [txHash, setTxHash] = useState(null);
  const [referralStatus, setReferralStatus] = useState("Waiting");
  const [events, setEvents] = useState([]);
  const [agentSignature, setAgentSignature] = useState(null);
  const [riskOracleAddress, setRiskOracleAddress] = useState("");
  const [scanWallet, setScanWallet] = useState("");
  const [transferState, setTransferState] = useState({ result: "Pending", reason: "ComplianceModule no llamado" });
  const [notification, setNotification] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [modal, setModal] = useState(null);
  const [dashboardDetail, setDashboardDetail] = useState(null);
  const [showBalance, setShowBalance] = useState(true);
  const [balance, setBalance] = useState(25000); // Saldo dinámico real
  const [selectedEquity, setSelectedEquity] = useState(null); // Estado para el modal de inversión
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Control del Sidebar Móvil

  // Cargar configuración inicial (Dirección del Oracle desde el Backend)
  useEffect(() => {
    fetch(`${API_URL}/api/wavy/config`)
      .then(res => res.json())
      .then(data => {
        if (data.riskOracleAddress) setRiskOracleAddress(data.riskOracleAddress);
      }).catch(err => console.error(err));
  }, []);

  // Auto-completar la wallet desde la sesión segura de Privy
  useEffect(() => {
    if (user) {
      // Intenta obtener la dirección de la wallet o el email como fallback
      const identifier = user.wallet?.address || user.email?.address || "";
      setKycForm(prev => ({ ...prev, wallet: identifier }));
      setScanWallet(identifier);
    }
  }, [user]);

  // Notificaciones (Reemplaza a los alert genéricos)
  const showNotification = (title, message, type = "info") => {
    setNotification({ title, message, type });
    setTimeout(() => setNotification(null), 5000);
  };

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

  // Procesar errores largos de Ethers.js
  const parseError = (err) => {
    if (err.code === "ACTION_REJECTED" || (err.message && err.message.toLowerCase().includes("rejected"))) {
      return "Transacción cancelada por el usuario en la wallet.";
    }
    return err.shortMessage || err.message || "Error desconocido.";
  };

  // 1. Guardar KYC en MongoDB
  const submitKyc = async () => {
    if (!kycForm.wallet) return showNotification("Faltan datos", "Por favor ingresa la wallet antes de enviar.", "warning");
    setWavyStatus("Guardando en Base de Datos...");
    try {
      await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          walletAddress: kycForm.wallet, 
          country: kycForm.country,
          fullName: kycForm.fullName,
          investorType: kycForm.investorType
        })
      });
      setProfileComplete(true);
      addEvent("approved", `Perfil de Inversor guardado en BD local para México.`);
      showNotification("KYC Aprobado", "Perfil guardado correctamente en la base de datos.", "success");
    } catch (error) {
      console.error(error);
      showNotification("Error", "No se pudo guardar en la base de datos.", "error");
    }
  };

  // 2. Escanear Wallet en Wavy y Firmar en el Backend
  const scanWavy = async () => {
    setWavyStatus("Consultando a Wavy Node...");
    try {
      const response = await fetch(`${API_URL}/api/wavy/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: scanWallet, description: `Kapitool Mexico IFC investor` })
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

  // Forzar la red Avalanche Fuji en la wallet
  const ensureFujiNetwork = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    if (network.chainId !== 43113n) {
      try {
        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xa869' }] }); // 43113 en hex
      } catch (err) {
        if (err.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xa869', chainName: 'Avalanche Fuji Testnet',
              nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
              rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
              blockExplorerUrls: ['https://testnet.snowtrace.io/']
            }]
          });
        } else throw err;
      }
    }
  };

  // 3. Enviar a Avalanche Fuji
  const requestAccess = async () => {
    if (!window.ethereum) return showNotification("Wallet no detectada", "Por favor, instala Core Wallet o MetaMask.", "warning");
    if (riskState.score === null || !agentSignature) return showNotification("Acción requerida", "Primero debes escanear la wallet en el Risk Gate.", "warning");
    if (!riskOracleAddress) return showNotification("Error de Configuración", "Falta RISK_ORACLE_ADDRESS en el .env del servidor.", "error");

    if (decision === "Blocked") {
       setReferralStatus("REJECTED");
       return addEvent("blocked", "Referral bloqueado: Actividad sospechosa o riesgo muy alto.");
    }

    try {
      await ensureFujiNetwork();

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
      const cleanError = parseError(error);
      setModal({
        title: "🚨 Transacción Rechazada",
        message: `La blockchain rechazó la operación antes de abrir la wallet.\n\nMotivo: ${cleanError}\n\n👉 Verifica que tu Core o MetaMask esté conectada a la red "Avalanche Fuji".`,
        type: "error"
      });
      addEvent("blocked", `Transacción fallida: ${cleanError}`);
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
         <img src={logo} alt="Kapitool Logo" style={{ height: '80px', marginBottom: '20px', objectFit: 'contain' }} />
         <p style={{ fontSize: '1.2rem', marginBottom: '30px', color: '#636e72' }}>México IFC - Portal de Distribución Regulada</p>
         <button onClick={login} style={{ padding: '15px 30px', fontSize: '18px', background: '#6c5ce7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
           Iniciar Sesión Seguro (Privy)
         </button>
      </div>
    )
  }

  // Simulación de la respuesta de una API B2B de Arkangeles (Mock Data)
  const mockEquities = [
    { id: 1, name: "FintechMex S.A.P.I.", type: "Equity (Capital)", target: "$10,000,000 MXN", minTicket: "$3,000 MXN", progress: "85%", logo: "🚀", color: "#0984e3" },
    { id: 2, name: "AgroTech Latam", type: "Deuda Convertible", target: "$5,000,000 MXN", minTicket: "$1,500 MXN", progress: "42%", logo: "🌱", color: "#00b894" },
    { id: 3, name: "BioSalud Inc.", type: "Equity (Capital)", target: "$8,500,000 MXN", minTicket: "$5,000 MXN", progress: "60%", logo: "🧬", color: "#d63031" },
    { id: 4, name: "EcoEnergy MX", type: "Deuda Senior", target: "$15,000,000 MXN", minTicket: "$10,000 MXN", progress: "90%", logo: "☀️", color: "#e17055" },
    { id: 5, name: "Logística Ya", type: "SAFE", target: "$3,000,000 MXN", minTicket: "$2,000 MXN", progress: "25%", logo: "🚚", color: "#6c5ce7" },
    { id: 6, name: "EduTech Global", type: "Equity", target: "$12,000,000 MXN", minTicket: "$4,000 MXN", progress: "75%", logo: "📚", color: "#00cec9" },
    { id: 7, name: "PropTech Hub", type: "Deuda Convertible", target: "$20,000,000 MXN", minTicket: "$20,000 MXN", progress: "50%", logo: "🏢", color: "#e84393" },
    { id: 8, name: "CyberSec Latam", type: "Equity", target: "$7,000,000 MXN", minTicket: "$5,000 MXN", progress: "15%", logo: "🔐", color: "#2d3436" },
    { id: 9, name: "FoodDelivery MX", type: "SAFE", target: "$4,500,000 MXN", minTicket: "$1,000 MXN", progress: "95%", logo: "🍔", color: "#fdcb6e" },
    { id: 10, name: "Virtual Reality VR", type: "Equity", target: "$6,000,000 MXN", minTicket: "$3,500 MXN", progress: "10%", logo: "🕶️", color: "#81ecec" }
  ];

  // 5. Botón Inicial de Invertir (Abre el Modal si está autorizado)
  const handleInvestClick = (equity) => {
    if (referralStatus !== "ROUTED") {
      showNotification("Acceso Denegado", "Debes guardar tu perfil en Avalanche antes de invertir.", "error");
      return;
    }
    setSelectedEquity(equity); // Abre el Modal
  };

  // 6. Ejecutar la Inversión Real (Blockchain) tras ingresar el PIN
  const executeInvestment = async (investAmount) => {
    const equity = selectedEquity;
    if (!equity) return;

    try {
      await ensureFujiNetwork();

      if (!window.ethereum) return showNotification("Wallet no detectada", "Instala Core o MetaMask", "warning");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      addEvent("review", `Iniciando proceso de inversión en ${equity.name}...`);
      
      // Hacemos una transferencia de 0 AVAX a la propia wallet del usuario para simular la inversión
      // Esto evita que el RiskOracle rechace la transacción por no tener función receive()
      const tx = await signer.sendTransaction({
        to: await signer.getAddress(), 
        value: 0
      });

      addEvent("review", `Enviando fondos a ${equity.name}. Esperando red Avalanche...`);
      await tx.wait();

      // Restar saldo (usando el valor dinámico que puso el usuario)
      setBalance(prev => prev - parseFloat(investAmount));
      setSelectedEquity(null); // Cerrar Modal

      showNotification("¡Inversión Exitosa!", `Tus activos de ${equity.name} han sido depositados.`, "success");
      addEvent("approved", `Inversión completada en ${equity.name}. Transacción: ${tx.hash}`);
      
      // Agregar al portafolio de gráficas
      setInvestments(prev => {
        const existing = prev.find(i => i.name === equity.name);
        if (existing) return prev.map(i => i.name === equity.name ? { ...i, value: i.value + 1 } : i);
        return [...prev, { name: equity.name, value: 1, color: equity.color }];
      });

    } catch (error) {
      console.error(error);
      const cleanError = parseError(error);
      setSelectedEquity(null);
      showNotification("Inversión Fallida", cleanError, "error");
      addEvent("blocked", `Inversión fallida: ${cleanError}`);
    }
  };

  // Dashboard Principal
  return (
    <div className="app-layout">
      <style>{`
        .app-layout { display: flex; flex-direction: row; min-height: 100vh; background-color: #f8f9fa; font-family: sans-serif; color: #333; }
        .main-content { flex: 1; padding: clamp(20px, 4vw, 40px); overflow-x: hidden; width: 100%; }
        @media (min-width: 768px) {
          .mobile-only { display: none !important; }
          .sidebar-container { transform: none !important; position: relative !important; }
        }
        @media (max-width: 767px) {
          .app-layout { flex-direction: column; }
          .sidebar-container { position: fixed !important; top: 0; left: 0; z-index: 50; height: 100vh; transition: transform 0.3s ease; }
          .sidebar-closed { transform: translateX(-100%); }
          .sidebar-open { transform: translateX(0); box-shadow: 0 0 20px rgba(0,0,0,0.2); }
          .main-content { padding-bottom: 80px; }
        }
      `}</style>
      
      {/* Navbar Móvil (Solo visible en celulares) */}
      <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: '15px 20px', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 30 }}>
        <img src={logo} alt="Kapitool" style={{ height: '32px', objectFit: 'contain' }} />
        <button onClick={() => setIsMobileMenuOpen(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#374151' }}>
          <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
      </div>

      {/* Overlay Oscuro para Menú Móvil */}
      {isMobileMenuOpen && (
        <div className="mobile-only" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 40, backdropFilter: 'blur(2px)' }} onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sistema de Notificaciones Toast */}
      {notification && (
        <div style={{
          position: 'fixed', top: '30px', right: '30px', zIndex: 9999,
          background: notification.type === 'error' ? '#ff7675' : notification.type === 'warning' ? '#fdcb6e' : '#55efc4',
          color: notification.type === 'warning' ? '#2d3436' : 'white',
          padding: '15px 25px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', gap: '5px', maxWidth: '350px',
          transition: 'all 0.3s ease-in-out'
        }}>
          <strong style={{ fontSize: '1.1rem' }}>{notification.title}</strong>
          <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{notification.message}</span>
        </div>
      )}

      {/* Modal Centrado para Mensajes Importantes */}
      {modal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: 'white', padding: '30px', borderRadius: '12px',
            maxWidth: '500px', width: '90%', position: 'relative',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <button onClick={() => setModal(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#b2bec3', transition: 'color 0.2s' }}>
              ✖
            </button>
            <h3 style={{ marginTop: 0, color: modal.type === 'error' ? '#d63031' : '#2d3436', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {modal.title}
            </h3>
            <p style={{ color: '#636e72', lineHeight: '1.6', whiteSpace: 'pre-wrap', fontSize: '1.05rem', margin: '20px 0' }}>
              {modal.message}
            </p>
            <div style={{ textAlign: 'right', marginTop: '25px' }}>
              <button onClick={() => setModal(null)} style={{ padding: '12px 25px', background: '#6c5ce7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 6px rgba(108, 92, 231, 0.2)' }}>Entendido</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Inversión Fintech (PIN Pad) */}
      {selectedEquity && (
        <InvestmentModal 
          equity={selectedEquity} 
          onClose={() => setSelectedEquity(null)} 
          onSuccess={executeInvestment} 
        />
      )}

      <aside className={`sidebar-container ${isMobileMenuOpen ? 'sidebar-open' : 'sidebar-closed'}`} style={{ width: '260px', backgroundColor: '#ffffff', borderRight: '1px solid #e5e7eb', padding: '25px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <img src={logo} alt="Kapitool" style={{ height: '35px', objectFit: 'contain' }} />
          <button className="mobile-only" onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '2rem', color: '#9ca3af', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
        </div>
        {["marketplace", "profile", "risk", "referral", "secondary", "dashboard"].map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'dashboard') setDashboardDetail(null); setIsMobileMenuOpen(false); }} style={{ background: activeTab === tab ? '#6c5ce7' : 'transparent', color: activeTab === tab ? 'white' : '#4b5563', border: 'none', padding: '12px 15px', textAlign: 'left', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer', textTransform: 'capitalize', fontSize: '16px', fontWeight: '500', transition: 'all 0.2s' }}>
            {tab}
          </button>
        ))}
        <div style={{ marginTop: 'auto', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
           <small style={{display: 'block', marginBottom:'15px', wordBreak: 'break-all', color: '#6b7280', fontSize: '12px'}}>User: {user.email?.address || user.wallet?.address}</small>
           <button onClick={logout} style={{ width: '100%', background: '#fee2e2', color: '#ef4444', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }}>Cerrar Sesión</button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="main-content">
         
         {/* Resumen Superior */}
         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
            <div style={{ flex: '1 1 120px' }}><small style={{ color: '#636e72', fontWeight: 'bold' }}>Producto</small><h3 style={{margin: '5px 0'}}>Mexico IFC</h3></div>
            <div style={{ flex: '1 1 120px' }}><small style={{ color: '#636e72', fontWeight: 'bold' }}>Wavy Score</small><h3 style={{ margin: '5px 0', color: riskState.score >= 60 ? '#d63031' : '#00b894' }}>{riskState.score === null ? "Sin Escanear" : `${riskState.score}/100`}</h3></div>
            <div style={{ flex: '1 1 120px' }}><small style={{ color: '#636e72', fontWeight: 'bold' }}>Decisión</small><h3 style={{ margin: '5px 0', color: decision === "Allowed" ? '#00b894' : decision === "Review" ? '#fdcb6e' : '#d63031' }}>{decision}</h3></div>
         </div>

         {/* Tarjeta de Saldo Disponible (Estilo Billetera Virtual) */}
         {(activeTab === "marketplace" || activeTab === "dashboard") && (
           <div style={{ maxWidth: '450px', margin: '0 auto 30px auto', background: '#ffffff', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.3s ease' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
               <span style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500' }}>Saldo Disponible</span>
               <button onClick={() => setShowBalance(!showBalance)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '50%', transition: 'color 0.2s' }} title={showBalance ? "Ocultar saldo" : "Mostrar saldo"}>
                 {showBalance ? (
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                 ) : (
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                 )}
               </button>
             </div>
             <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#111827', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
               {showBalance ? `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "••••••••"} <span style={{ fontSize: '1.25rem', fontWeight: '600', color: '#6b7280' }}>MXN</span>
             </div>
           </div>
         )}

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
                    <div key={equity.id} style={{ flex: '1 1 300px', border: '1px solid #dfe6e9', padding: '20px', borderRadius: '12px', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                        <small style={{ color: '#6c5ce7', fontWeight: 'bold' }}>{equity.progress} Fondeado</small>
                        <button onClick={() => handleInvestClick(equity)} style={{ padding: '8px 15px', background: '#2d3436', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                          Invertir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                <h2 style={{ marginTop: 0, fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>Perfil del Inversor (KYC)</h2>
                
                {profileComplete ? (
                  <>
                    <UserProfile userEmail={user?.email?.address || kycForm.wallet} />
                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                       <button onClick={() => setProfileComplete(false)} style={{ padding: '8px 16px', background: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.875rem', transition: 'all 0.2s' }}>Editar Cuestionario KYC</button>
                    </div>
                  </>
                ) : (
                  <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', padding: '2rem' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: '#374151', fontSize: '1.125rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>Completar Información Regulatoria</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Nombre Completo</label>
                        <input value={kycForm.fullName} onChange={e => setKycForm({...kycForm, fullName: e.target.value})} placeholder="Ej: Carlos Slim" style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', color: '#111827' }} />
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>CURP / Identificación Oficial</label>
                        <input value={kycForm.curp} onChange={e => setKycForm({...kycForm, curp: e.target.value})} placeholder="Ej: ABCD901234HDFLR00" style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', textTransform: 'uppercase', color: '#111827' }} />
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Tipo de Inversor</label>
                        <select value={kycForm.investorType} onChange={e => setKycForm({...kycForm, investorType: e.target.value})} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', background: 'white', color: '#111827' }}>
                          <option value="Minorista">Minorista (Retail)</option>
                          <option value="Sofisticado">Acreditado / Sofisticado</option>
                          <option value="Institucional">Institucional</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Ingreso Anual Estimado (MXN)</label>
                        <select value={kycForm.annualIncome} onChange={e => setKycForm({...kycForm, annualIncome: e.target.value})} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', background: 'white', color: '#111827' }}>
                          <option value="">Selecciona un rango...</option>
                          <option value="Menos de $500k">Menos de $500,000</option>
                          <option value="$500k - $1.5M">$500,000 - $1,500,000</option>
                          <option value="Más de $1.5M">Más de $1,500,000</option>
                        </select>
                      </div>

                      <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Identificador Seguro (Privy)</label>
                        <input value={kycForm.wallet} disabled style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed', fontFamily: 'monospace' }} title="Obtenido automáticamente de tu sesión segura" />
                      </div>
                    </div>

                    <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                      <button onClick={submitKyc} style={{ padding: '12px 24px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(79, 70, 229, 0.2)' }}>
                        {kycForm.fullName ? 'Actualizar Perfil' : 'Guardar y Verificar KYC'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "risk" && (
              <div>
                <h2>Wavy Risk Gate</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '20px' }}>
                  <input value={scanWallet} disabled style={{ flex: '1 1 250px', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', background: '#e0e7ff', color: '#6c5ce7', fontWeight: 'bold' }} title="Wallet asegurada por Privy" />
                  <button onClick={scanWavy} style={{ flex: '1 1 150px', padding: '10px 20px', background: '#e17055', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Run Wavy Scan</button>
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
                   <p><strong>Tx Hash:</strong> {txHash ? <a href={`https://testnet.snowtrace.io/tx/${txHash}`} target="_blank" rel="noreferrer" style={{ color: '#6c5ce7', textDecoration: 'none', fontWeight: 'bold' }}>{txHash.slice(0, 6)}...{txHash.slice(-4)} ↗</a> : "Sin enviar"}</p>
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
              <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
                <h2 style={{ marginTop: 0, fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
                  Panel de Control y Auditoría
                </h2>
                
                {/* Dashboard Responsivo con Clases de Tailwind */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  
                  {/* Columna Izquierda: Portafolio de Activos (Gráfico) */}
                  <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                     <h3 style={{ marginTop: 0, fontSize: '1.125rem', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', marginBottom: '2rem' }}>
                        Distribución de Activos
                     </h3>

                     {investments.length > 0 ? (
                        <>
                          {/* Gráfico de Torta (Puro CSS Conic Gradient) */}
                          <div style={{ 
                            width: '200px', 
                            height: '200px', 
                            borderRadius: '50%', 
                            margin: '0 auto 2.5rem auto',
                            background: `conic-gradient(${investments.map((inv, idx, arr) => {
                                const total = arr.reduce((sum, item) => sum + item.value, 0);
                                const start = arr.slice(0, idx).reduce((sum, item) => sum + (item.value / total) * 100, 0);
                                const end = start + (inv.value / total) * 100;
                                const pastelBlues = ['#60a5fa', '#93c5fd', '#3b82f6', '#bfdbfe', '#2563eb'];
                                inv.pastelColor = pastelBlues[idx % pastelBlues.length]; // Guardamos el color para la tabla
                                return `${inv.pastelColor} ${start}% ${end}%`;
                            }).join(', ')})`,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.08), inset 0 2px 4px rgba(0,0,0,0.05)'
                          }} />

                          {/* Tabla de Detalles HTML */}
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', color: '#4b5563' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ textAlign: 'left', padding: '0.5rem', fontWeight: 600, color: '#374151' }}>Activo / Empresa</th>
                                <th style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 600, color: '#374151' }}>Participación</th>
                                <th style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 600, color: '#374151' }}>Cantidad</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...investments].sort((a,b) => b.value - a.value).map((inv, i) => {
                                const totalInvestments = investments.reduce((sum, item) => sum + item.value, 0);
                                return (
                                  <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                                    <td style={{ padding: '0.75rem 0.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, color: '#1f2937' }}>
                                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: inv.pastelColor }}></div>
                                      {inv.name}
                                    </td>
                                    <td style={{ textAlign: 'right', padding: '0.75rem 0.5rem' }}>
                                      {((inv.value / totalInvestments) * 100).toFixed(1)}%
                                    </td>
                                    <td style={{ textAlign: 'right', padding: '0.75rem 0.5rem', fontFamily: 'monospace', fontWeight: 500, color: '#4f46e5' }}>
                                      {inv.value} txs
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </>
                     ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', marginTop: '2rem' }}>
                           <p>Aún no hay inversiones en tu portafolio.</p>
                        </div>
                     )}
                  </div>

                  {/* Columna Derecha: Auditoría (Eventos) */}
                  <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', padding: '1.5rem', display: 'flex', flexDirection: 'column', maxHeight: '550px' }}>
                     <h3 style={{ marginTop: 0, fontSize: '1.125rem', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Eventos On-Chain
                        <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '9999px', fontWeight: 'bold' }}>{events.length} logs</span>
                     </h3>
                     <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {events.map((ev, i) => (
                            <li key={i} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid', borderColor: ev.type === 'blocked' ? '#fee2e2' : '#f3f4f6', backgroundColor: ev.type === 'blocked' ? '#fef2f2' : '#f9fafb', fontSize: '14px', color: ev.type === 'blocked' ? '#b91c1c' : '#4b5563' }}>
                              <div style={{ fontSize: '12px', fontFamily: 'monospace', opacity: 0.7, marginBottom: '4px' }}>{ev.at}</div>
                              <div>{ev.text}</div>
                            </li>
                          ))}
                          {events.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0' }}>Sin eventos aún.</p>}
                        </ul>
                     </div>
                  </div>
                </div>
              </div>
            )}
         </div>
      </main>
    </div>
  );
}

export default App;
