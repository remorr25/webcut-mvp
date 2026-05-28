import React from 'react';
import useProjectStore from '../store/projectStore';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`ErrorBoundary caught an error in ${this.props.componentName}:`, error, errorInfo);
  }

  handleReset = () => {
    // Reset project state to recover
    useProjectStore.getState().initProject();
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          flex: 1, padding: '20px', background: '#1a1a1a', color: '#f0f0f0', textAlign: 'center',
          fontFamily: 'Inter, sans-serif', width: '100%', height: '100%'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
            Something went wrong in {this.props.componentName}
          </h2>
          <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '20px', maxWidth: '400px', wordBreak: 'break-word' }}>
            {this.state.error?.toString()}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '8px 16px', background: '#6c63ff', color: '#fff', border: 'none',
              borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer'
            }}
          >
            Reset Project
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
