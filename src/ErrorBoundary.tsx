import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  declare public state: State;
  declare public props: Props;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-brand-offwhite p-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full border border-red-100">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 className="text-2xl font-bold text-brand-ink mb-2 text-center font-serif italic">Ops! Algo deu errado.</h2>
            <p className="text-brand-metallic text-center mb-6 text-sm">O aplicativo encontrou um erro inesperado. Veja os detalhes abaixo:</p>
            <pre className="bg-brand-offwhite/50 p-4 rounded-xl text-xs overflow-auto max-h-48 text-red-500 font-mono border border-brand-nude/30 mb-6">
              {this.state.error?.message}
              {'\n'}
              {this.state.error?.stack}
            </pre>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white py-4 rounded-xl font-bold transition-all"
            >
              Recarregar Página
            </button>
            <p className="text-center text-[10px] text-brand-metallic/60 mt-4">Se o erro persistir, entre em contato com o suporte.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
