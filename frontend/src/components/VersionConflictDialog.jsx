const VersionConflictDialog = ({ isOpen, onClose, onReload, currentData, newData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          Dữ liệu đã thay đổi
        </h3>
        
        <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">
          Task này đã được cập nhật bởi người khác. Bạn có muốn tải lại dữ liệu mới nhất không?
        </p>

        {currentData && newData && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded text-xs sm:text-sm">
            <p className="font-medium mb-1 sm:mb-2">Thay đổi:</p>
            {currentData.tName !== newData.tName && (
              <p className="text-gray-600 break-words">
                Tên: "{currentData.tName}" → "{newData.tName}"
              </p>
            )}
            {currentData.tStatus !== newData.tStatus && (
              <p className="text-gray-600 break-words">
                Trạng thái: "{currentData.tStatus}" → "{newData.tStatus}"
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Hủy
          </button>
          <button
            onClick={onReload}
            className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Tải lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionConflictDialog;

