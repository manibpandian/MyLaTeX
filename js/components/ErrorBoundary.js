// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Tree component error:', error);
    console.error('Error info:', errorInfo);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', { className: 'error-boundary' },
        React.createElement('h2', null, 'Something went wrong'),
        React.createElement('p', null, 'The file tree encountered an error. Please refresh the page.'),
        React.createElement('button', {
          onClick: () => window.location.reload(),
          className: 'error-retry-btn'
        }, 'Reload Page')
      );
    }
    return this.props.children;
  }
}
