import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { PrivyProvider } from '@privy-io/react-auth'

// ⚠️ ¡Ojo! Habías puesto el App Secret. Aquí va el "App ID" (es más corto y suele empezar con 'cm...' o 'did:privy:')
const privyAppId = "cmp8nzet001jy0djs9wtvgv3l"; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'light',
          accentColor: '#6c5ce7',
          logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png', // Logo de Avalanche para que se vea pro
        },
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>,
)
