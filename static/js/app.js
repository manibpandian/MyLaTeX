// Main App Component
const App = () => {
  return React.createElement(ErrorBoundary, null,
    React.createElement(StatusProvider, null,
      React.createElement(TreeView, null)
    )
  );
};

// React 18 API
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
