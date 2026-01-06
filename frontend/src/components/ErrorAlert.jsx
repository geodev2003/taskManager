const ErrorAlert = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex justify-between items-start">
      <p>{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-red-700 hover:text-red-900"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;

