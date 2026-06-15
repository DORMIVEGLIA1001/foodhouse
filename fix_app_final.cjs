const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const search = `                        <div className="flex items-center space-x-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
            
            <div className="space-y-4 text-xs">
              
              </div>

              <div>`;

const replace = `                        <div className="flex items-center space-x-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={\`w-3 h-3 \${star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}\`} />
                          ))}
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed italic font-medium font-sans">"{rev.text}"</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-6 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500 block font-mono font-bold">Đơn giá đặc sản</span>
                <span className="text-xl font-serif font-bold text-[#8a6538]">
                  {selectedDishDetail.price.toLocaleString('vi-VN')} đ
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleFavoriteToggle(selectedDishDetail.name);
                  }}
                  className={\`p-3 rounded-2xl border transition-all cursor-pointer \${
                    preferences.favorites?.includes(selectedDishDetail.name)
                      ? 'bg-amber-500/10 text-[#8a6538] border-amber-500/30'
                      : 'bg-white text-stone-600 border-stone-250 hover:bg-stone-100 shadow-xs'
                  }\`}
                  title="Thêm hoặc xóa khỏi danh mục yêu thích"
                >
                  <Heart className={\`w-5 h-5 \${preferences.favorites?.includes(selectedDishDetail.name) ? 'fill-current text-rose-500' : ''}\`} />
                </button>

                <button
                  onClick={() => {
                    handleAddToCart(selectedDishDetail.id);
                    setSelectedDishDetail(null);
                  }}
                  className="px-6 py-3 bg-[#8a6538] hover:bg-[#6c4d29] text-white font-bold rounded-2xl text-xs uppercase tracking-widest cursor-pointer transition-all flex items-center gap-2 shadow-xs"
                >
                  <ShoppingCart className="w-4 h-4 text-white" />
                  Thêm vào giỏ món
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 1: Checkout Form Modal */}
      {showCheckoutModal && (
        <div id="checkout-form-modal" className="fixed inset-0 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-stone-250 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowCheckoutModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-serif font-bold italic text-[#8a6538] mb-4">Xác nhận thông tin giao nhận & Thanh toán</h3>
            
            <div className="space-y-4 text-xs">
              
              {/* Delivery / Dine-in Tab Toggle */}
              <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 mb-4">
                <button
                  onClick={() => setDeliveryType('delivery')}
                  className={\`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer text-[11px] \${deliveryType === 'delivery' ? 'bg-[#8a6538] text-white font-bold shadow-xs' : 'text-stone-500 hover:text-stone-850 font-semibold'}\`}
                >
                  Giao tận nơi
                </button>
                <button
                  onClick={() => setDeliveryType('dine_in')}
                  className={\`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer text-[11px] \${deliveryType === 'dine_in' ? 'bg-[#8a6538] text-white font-bold shadow-xs' : 'text-stone-500 hover:text-stone-850 font-semibold'}\`}
                >
                  Ăn tại cửa hàng
                </button>
              </div>

              <div>`;

if (code.includes(search)) {
  code = code.replace(search, replace);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Successfully repaired App.tsx MODAL 1 structure!');
} else {
  console.log('Search string not found!');
  // Let's try flexible replace
  const regex = /<div className="flex items-center space-x-0\.5">\s*\{\[1, 2, 3, 4, 5\]\.map\(\(star\) => \(\s*<div className="space-y-4 text-xs">\s*<\/div>\s*<div>/;
  if (regex.test(code)) {
    code = code.replace(regex, replace);
    fs.writeFileSync('src/App.tsx', code);
    console.log('Successfully repaired App.tsx MODAL 1 structure via Regex!');
  } else {
    console.log("Could not find the broken MODAL 1 structure either!");
  }
}
