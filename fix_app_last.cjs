const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const search = `              {deliveryType === 'delivery' && (
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Địa chỉ giao hàng tận tay</label>
                  <input 
                    type="text" 
                    value={checkoutAddress}
                    onChange={(e) => setCheckoutAddress(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-850 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-[#8a6538] focus:border-[#8a6538]"
                  />
                </div>
                  <button
                    onClick={() => setSelectedPayment('zalopay')}
                    className={\`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer \${selectedPayment === 'zalopay' ? 'border-[#0068ff] bg-[#0068ff]/5 text-[#0068ff] font-bold' : 'border-stone-250 bg-stone-50 text-stone-500 hover:bg-stone-100 font-medium'}\`}
                  >
                    <span className="w-5 h-5 bg-[#0068ff] rounded-full text-white flex items-center justify-center text-[10px] font-extrabold mb-1">Z</span>
                    <span className="text-[10px]">ZALO PAY</span>
                  </button>

                  <button
                    onClick={() => setSelectedPayment('cash')}
                    className={\`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer \${selectedPayment === 'cash' ? 'border-[#8a6538] bg-[#8a6538]/5 text-[#8a6538] font-bold' : 'border-stone-250 bg-stone-50 text-stone-500 hover:bg-stone-100 font-medium'}\`}
                  >
                    <span className="w-5 h-5 bg-stone-200 rounded-full text-[#8a6538] flex items-center justify-center text-[10.5px] font-extrabold mb-1">C</span>
                    <span className="text-[10px]">TIỀN MẶT</span>
                  </button>
                </div>
              </div>

            </div>

            <button
              onClick={executeCheckout}
              className="w-full mt-6 py-3 bg-[#8a6538] hover:bg-[#6c4d29] text-white font-bold text-xs uppercase tracking-widest rounded-xl cursor-pointer shadow-xs transition-colors"
            >
              Xác nhận Đặt hàng & Ship ngay
            </button>
          </div>
            ) : (`;

const replace = `              {deliveryType === 'delivery' && (
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Địa chỉ giao hàng tận tay</label>
                  <input 
                    type="text" 
                    value={checkoutAddress}
                    onChange={(e) => setCheckoutAddress(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-850 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-[#8a6538] focus:border-[#8a6538]"
                  />
                </div>
              )}

              {/* Integrated Payment Gateways Selection (Zalo / MoMo) */}
              <div>
                <label className="block text-stone-600 font-semibold mb-2 uppercase tracking-wide font-mono text-[10px]">Cổng thanh toán liên kết</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedPayment('momo')}
                    className={\`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer \${selectedPayment === 'momo' ? 'border-[#a50064] bg-[#a50064]/5 text-[#a50064] font-bold' : 'border-stone-250 bg-stone-50 text-stone-500 hover:bg-stone-100 font-medium'}\`}
                  >
                    <span className="w-5 h-5 bg-[#a50064] rounded-full text-white flex items-center justify-center text-[10px] font-extrabold mb-1">M</span>
                    <span className="text-[10px]">MOMO API</span>
                  </button>

                  <button
                    onClick={() => setSelectedPayment('zalopay')}
                    className={\`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer \${selectedPayment === 'zalopay' ? 'border-[#0068ff] bg-[#0068ff]/5 text-[#0068ff] font-bold' : 'border-stone-250 bg-stone-50 text-stone-500 hover:bg-stone-100 font-medium'}\`}
                  >
                    <span className="w-5 h-5 bg-[#0068ff] rounded-full text-white flex items-center justify-center text-[10px] font-extrabold mb-1">Z</span>
                    <span className="text-[10px]">ZALO PAY</span>
                  </button>

                  <button
                    onClick={() => setSelectedPayment('cash')}
                    className={\`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer \${selectedPayment === 'cash' ? 'border-[#8a6538] bg-[#8a6538]/5 text-[#8a6538] font-bold' : 'border-stone-250 bg-stone-50 text-stone-500 hover:bg-stone-100 font-medium'}\`}
                  >
                    <span className="w-5 h-5 bg-stone-200 rounded-full text-[#8a6538] flex items-center justify-center text-[10.5px] font-extrabold mb-1">C</span>
                    <span className="text-[10px]">TIỀN MẶT</span>
                  </button>
                </div>
              </div>

            </div>

            <button
              onClick={executeCheckout}
              className="w-full mt-6 py-3 bg-[#8a6538] hover:bg-[#6c4d29] text-white font-bold text-xs uppercase tracking-widest rounded-xl cursor-pointer shadow-xs transition-colors"
            >
              Xác nhận Đặt hàng & Ship ngay
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Interactive ZaloPay / MoMo Simulated Pay Gateway */}
      {paymentQRModal.isOpen && (
        <div id="payment-qr-modal" className="fixed inset-0 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className={\`bg-white border border-stone-250 rounded-3xl w-full p-6 text-center shadow-2xl relative transition-all duration-300 \${paymentGatewayMode === 'sandbox' ? 'max-w-3xl' : 'max-w-sm'}\`}>
            <button 
              onClick={() => setPaymentQRModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Segment Tab Bar to toggle mode */}
            <div className="flex bg-stone-100 p-1 rounded-xl mb-5 max-w-md mx-auto border border-stone-200">
              <button
                onClick={() => setPaymentGatewayMode('sandbox')}
                className={\`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer \${paymentGatewayMode === 'sandbox' ? 'bg-[#8a6538] text-white shadow-xs' : 'text-stone-600 hover:text-stone-800'}\`}
              >
                Môi trường Sandbox API (ZaloPay / MoMo)
              </button>
              <button
                onClick={() => setPaymentGatewayMode('vietqr')}
                className={\`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer \${paymentGatewayMode === 'vietqr' ? 'bg-[#8a6538] text-white shadow-xs' : 'text-stone-600 hover:text-stone-800'}\`}
              >
                Quét mã VietQR Nhanh
              </button>
            </div>

            {paymentGatewayMode === 'vietqr' ? (
              // --- STANDARD VIETQR MODE ---
              <div className="max-w-sm mx-auto">
                {paymentQRModal.method === 'momo' ? (
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-[#a50064] text-white rounded-2xl text-xl font-bold mb-3 font-serif shadow-xs">M</div>
                ) : (
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-[#0068ff] text-white rounded-2xl text-xl font-bold mb-3 font-serif animate-bounce shadow-xs">Z</div>
                )}

                <h3 className="text-base font-serif font-bold text-stone-850 uppercase tracking-wide">CỔNG LIÊN KẾT THANH TOÁN TRỰC TUYẾN</h3>
                <p className="text-xs text-stone-500 mt-1 font-medium leading-normal">Quét mã QR dưới để tiến hành thanh toán xác thực hóa đơn</p>

                <div className="my-5 bg-white p-3.5 inline-block rounded-2xl border border-stone-250 shadow-sm relative overflow-hidden">
                  {(() => {
                    const cleanId = (paymentQRModal.orderId || 'HV-ORDER').replace(/\\s+/g, '');
                    const totalAmt = paymentQRModal.amount + 15000;
                    const payLink = \`https://img.vietqr.io/image/\${bankId}-\${bankNo}-compact2.png?amount=\${totalAmt}&addInfo=Don%20Hang%20Huong%20Viet%20\${cleanId}&accountName=\${encodeURIComponent(bankName)}\`;
                    return (
                      <img 
                        src={payLink} 
                        alt="VietQR Chuyển Khoản Thực Tế"
                        referrerPolicy="no-referrer"
                        className="w-44 h-44 object-contain rounded-lg mx-auto" 
                      />
                    );
                  })()}
                  <div className="absolute bottom-2.5 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs">
                    {paymentQRModal.method === 'momo' ? (
                      <span className="text-[8px] font-serif font-black text-[#a50064]">M</span>
                    ) : (
                      <span className="text-[8px] font-serif font-black text-[#0068ff]">Z</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-stone-600 font-medium">
                  <p>Mã đơn hàng: <strong className="text-[#8a6538] font-mono font-bold">{paymentQRModal.orderId}</strong></p>
                  <p>Cần chuyển khoản: <strong className="text-lg text-[#8a6538] font-serif font-black">{(paymentQRModal.amount + 15000).toLocaleString('vi-VN')} đ</strong></p>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setPaymentQRModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-605 text-xs font-bold leading-normal tracking-wide rounded-lg cursor-pointer transition-colors"
                  >
                    Hủy giao dịch
                  </button>

                  <button
                    id="btn-confirm-pay"
                    onClick={() => handleConfirmDirectPayment(paymentQRModal.orderId, paymentQRModal.method)}
                    className="flex-1 py-1.5 bg-[#8a6538] hover:bg-[#6c4d29] text-white font-bold text-xs uppercase tracking-wide rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    Tôi đã quét mã xong
                  </button>
                </div>
                <p className="text-[10px] text-stone-400 italic mt-3 font-medium">Xử lý tự động trong môi trường thử nghiệm AI Studio</p>
              </div>
            ) : (`;

if (code.includes(search)) {
  code = code.replace(search, replace);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Successfully repaired App.tsx the FINAL time');
} else {
  console.log('Search block not found. Checking exactly what it is.');
}
