const { useState, createContext, useContext, useCallback } = React;

// Notification Context
const NotificationContext = createContext();

// Status Provider for subtle status messages
const StatusProvider = ({ children }) => {
  const [status, setStatus] = useState({ message: '', type: 'info', visible: false });
  const [timeoutId, setTimeoutId] = useState(null);

  const showStatus = useCallback((message, type = 'info', duration = 3000) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    setStatus({ message, type, visible: true });
    
    if (duration > 0) {
      const newTimeoutId = setTimeout(() => {
        setStatus(prev => ({ ...prev, visible: false }));
      }, duration);
      setTimeoutId(newTimeoutId);
    }
  }, [timeoutId]);

  const hideStatus = useCallback(() => {
    setStatus(prev => ({ ...prev, visible: false }));
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  return React.createElement(NotificationContext.Provider, {
    value: { addNotification: showStatus, removeNotification: hideStatus, status }
  }, children);
};

// Custom hook for notifications
const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
