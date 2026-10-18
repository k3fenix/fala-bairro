import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React App:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', textAlign: 'center', fontFamily: 'sans-serif', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/logo-fala-bairro.svg" alt="Fala do Bairro" style={{ width: '64px', height: '64px', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>Ops! Ocorreu uma oscilação temporária.</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '360px', marginBottom: '20px' }}>
            Atualizamos os dados do aplicativo para que você continue navegando com segurança.
          </p>
          <button
            onClick={() => {
              try {
                localStorage.removeItem('fala_bairro_user');
                localStorage.removeItem('user');
                localStorage.removeItem('user_auth');
              } catch (_) {}
              window.location.reload();
            }}
            style={{
              padding: '10px 20px',
              background: '#ff5100',
              color: '#ffffff',
              border: 'none',
              borderRadius: '9999px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Recarregar Página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
export default ErrorBoundary;
