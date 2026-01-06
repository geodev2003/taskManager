const LoadingSpinner = ({ message = 'Đang tải...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="mt-2 text-gray-600">{message}</p>
    </div>
  );
};

export default LoadingSpinner;

