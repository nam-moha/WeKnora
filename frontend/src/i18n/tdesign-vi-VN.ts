/**
 * Vietnamese global config for TDesign components.
 *
 * tdesign-vue-next ships no vi_VN locale, so this mirrors the structure of
 * `tdesign-vue-next/esm/locale/en_US`. `dayjsLocale` stays "en" because dayjs is
 * only a transitive dependency; weekday/month labels come from this config instead.
 */
export default {
  autoComplete: {
    empty: 'Không có dữ liệu'
  },
  pagination: {
    itemsPerPage: '{size} / trang',
    jumpTo: 'Đi tới',
    page: '',
    total: 'Không có mục nào | 1 mục | {count} mục'
  },
  cascader: {
    empty: 'Không có dữ liệu',
    loadingText: 'Đang tải...',
    placeholder: 'Vui lòng chọn'
  },
  calendar: {
    yearSelection: '{year}',
    monthSelection: 'Tháng {month}',
    yearRadio: 'Năm',
    monthRadio: 'Tháng',
    hideWeekend: 'Ẩn cuối tuần',
    showWeekend: 'Hiện cuối tuần',
    today: 'Hôm nay',
    thisMonth: 'Tháng này',
    week: 'Thứ Hai,Thứ Ba,Thứ Tư,Thứ Năm,Thứ Sáu,Thứ Bảy,Chủ Nhật',
    cellMonth: 'Tháng 1,Tháng 2,Tháng 3,Tháng 4,Tháng 5,Tháng 6,Tháng 7,Tháng 8,Tháng 9,Tháng 10,Tháng 11,Tháng 12'
  },
  transfer: {
    title: '{checked} / {total}',
    empty: 'Không có dữ liệu',
    placeholder: 'Nhập từ khóa để tìm kiếm'
  },
  timePicker: {
    dayjsLocale: 'en',
    now: 'Bây giờ',
    confirm: 'Xác nhận',
    anteMeridiem: 'SA',
    postMeridiem: 'CH',
    placeholder: 'Chọn thời gian'
  },
  dialog: {
    confirm: 'Xác nhận',
    cancel: 'Hủy'
  },
  drawer: {
    confirm: 'Xác nhận',
    cancel: 'Hủy'
  },
  popconfirm: {
    confirm: {
      content: 'OK'
    },
    cancel: {
      content: 'Hủy'
    }
  },
  table: {
    empty: 'Không có dữ liệu',
    loadingText: 'Đang tải...',
    loadingMoreText: 'Đang tải thêm',
    filterInputPlaceholder: '',
    sortAscendingOperationText: 'Nhấn để sắp xếp tăng dần',
    sortCancelOperationText: 'Nhấn để bỏ sắp xếp',
    sortDescendingOperationText: 'Nhấn để sắp xếp giảm dần',
    clearFilterResultButtonText: 'Xóa',
    columnConfigButtonText: 'Cấu hình cột',
    columnConfigTitleText: 'Cấu hình cột của bảng',
    columnConfigDescriptionText: 'Vui lòng chọn các cột muốn hiển thị trong bảng',
    confirmText: 'Xác nhận',
    cancelText: 'Hủy',
    resetText: 'Đặt lại',
    selectAllText: 'Chọn tất cả',
    searchResultText: 'Tìm “{result}”: không có kết quả. | Tìm “{result}”: tìm thấy 1 mục. | Tìm “{result}”: tìm thấy {count} mục.'
  },
  select: {
    empty: 'Không có dữ liệu',
    loadingText: 'Đang tải...',
    placeholder: 'Vui lòng chọn'
  },
  tree: {
    empty: 'Không có dữ liệu'
  },
  treeSelect: {
    empty: 'Không có dữ liệu',
    loadingText: 'Đang tải...',
    placeholder: 'Vui lòng chọn'
  },
  datePicker: {
    dayjsLocale: 'en',
    placeholder: {
      date: 'Chọn ngày',
      month: 'Chọn tháng',
      year: 'Chọn năm',
      quarter: 'Chọn quý',
      week: 'Chọn tuần'
    },
    weekdays: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    months: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
    quarters: ['Q1', 'Q2', 'Q3', 'Q4'],
    rangeSeparator: ' - ',
    direction: 'ltr',
    format: 'YYYY-MM-DD',
    dayAriaLabel: 'Ngày',
    yearAriaLabel: 'Năm',
    monthAriaLabel: 'Tháng',
    weekAbbreviation: 'Tuần',
    confirm: 'Xác nhận',
    selectTime: 'Chọn giờ',
    selectDate: 'Chọn ngày',
    nextYear: 'Năm sau',
    preYear: 'Năm trước',
    nextMonth: 'Tháng sau',
    preMonth: 'Tháng trước',
    preDecade: 'Thập kỷ trước',
    nextDecade: 'Thập kỷ sau',
    now: 'Bây giờ'
  },
  upload: {
    sizeLimitMessage: 'Tệp quá lớn để tải lên. {sizeLimit}',
    cancelUploadText: 'Hủy',
    triggerUploadText: {
      fileInput: 'Tải lên',
      image: 'Nhấn để tải lên',
      normal: 'Tải lên',
      reupload: 'Tải lên lại',
      continueUpload: 'Tiếp tục tải lên',
      delete: 'Xóa',
      uploading: 'Đang tải lên'
    },
    dragger: {
      dragDropText: 'Thả tệp vào đây',
      draggingText: 'Kéo tệp vào vùng này để tải lên',
      clickAndDragText: 'Nhấn “Tải lên” hoặc kéo tệp vào vùng này để tải lên'
    },
    file: {
      fileNameText: 'Tên tệp',
      fileSizeText: 'Kích thước',
      fileStatusText: 'Trạng thái',
      fileOperationText: 'Thao tác',
      fileOperationDateText: 'Ngày'
    },
    progress: {
      uploadingText: 'Đang tải lên',
      waitingText: 'Đang chờ',
      failText: 'Thất bại',
      successText: 'Thành công'
    }
  },
  form: {
    errorMessage: {
      date: '${name} không hợp lệ',
      url: '${name} không hợp lệ',
      required: '${name} là bắt buộc',
      whitespace: '${name} không được để trống',
      max: '${name} không được dài quá ${validate} ký tự',
      min: '${name} phải có ít nhất ${validate} ký tự',
      len: '${name} phải có đúng ${validate} ký tự',
      enum: '${name} phải là một trong các giá trị ${validate}',
      idcard: '${name} không hợp lệ',
      telnumber: '${name} không hợp lệ',
      pattern: '${name} không hợp lệ',
      validator: '${name} không hợp lệ',
      boolean: '${name} không phải kiểu boolean',
      number: '${name} phải là số',
      email: '${name} không hợp lệ'
    },
    colonText: ':'
  },
  input: {
    placeholder: 'Vui lòng nhập'
  },
  list: {
    loadingText: 'Đang tải...',
    loadingMoreText: 'Đang tải thêm'
  },
  alert: {
    expandText: 'Mở rộng',
    collapseText: 'Thu gọn'
  },
  anchor: {
    copySuccessText: 'Đã sao chép liên kết',
    copyText: 'Sao chép liên kết'
  },
  colorPicker: {
    swatchColorTitle: 'Mặc định hệ thống',
    recentColorTitle: 'Dùng gần đây',
    clearConfirmText: 'Xóa các màu dùng gần đây?',
    singleColor: 'Đơn sắc',
    gradientColor: 'Gradient'
  },
  guide: {
    finishButtonProps: {
      content: 'Hoàn tất',
      theme: 'primary'
    },
    nextButtonProps: {
      content: 'Bước tiếp',
      theme: 'primary'
    },
    skipButtonProps: {
      content: 'Bỏ qua',
      theme: 'default'
    },
    prevButtonProps: {
      content: 'Bước trước',
      theme: 'default'
    }
  },
  image: {
    errorText: 'Không tải được ảnh',
    loadingText: 'Đang tải'
  },
  imageViewer: {
    errorText: 'Không tải được ảnh',
    mirrorTipText: 'Lật ảnh',
    rotateTipText: 'Xoay',
    originalSizeTipText: 'Kích thước gốc',
    previewText: 'Xem trước'
  },
  typography: {
    expandText: 'Xem thêm',
    collapseText: 'Thu gọn',
    copiedText: 'Đã sao chép'
  },
  rate: {
    rateText: ['Rất tệ', 'Thất vọng', 'Bình thường', 'Hài lòng', 'Tuyệt vời']
  },
  empty: {
    titleText: {
      maintenance: 'Đang bảo trì',
      success: 'Thành công',
      fail: 'Thất bại',
      empty: 'Không có dữ liệu',
      networkError: 'Lỗi mạng'
    }
  },
  descriptions: {
    colonText: ':'
  },
  chat: {
    placeholder: 'Nhập tin nhắn...',
    stopBtnText: 'Dừng',
    refreshTipText: 'Tạo lại',
    copyTipText: 'Sao chép',
    likeTipText: 'Thích',
    dislikeTipText: 'Không thích',
    copyCodeBtnText: 'Sao chép code',
    copyCodeSuccessText: 'Đã sao chép',
    clearHistoryBtnText: 'Xóa lịch sử',
    copyTextSuccess: 'Đã sao chép',
    copyTextFail: 'Sao chép thất bại',
    confirmClearHistory: 'Bạn có chắc chắn muốn xóa toàn bộ tin nhắn?',
    loadingText: 'Đang suy nghĩ...',
    loadingEndText: 'Đã suy luận xong',
    uploadImageText: 'Tải ảnh lên',
    uploadAttachmentText: 'Tải tệp đính kèm lên',
    shareTipText: 'Chia sẻ'
  },
  qrcode: {
    expiredText: 'Đã hết hạn',
    refreshText: 'Làm mới',
    scannedText: 'Đã quét'
  }
}
