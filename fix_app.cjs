const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Restore Delivery Type
const dtSearch = `            <div className="space-y-4 text-xs">
              
              </div>

              <div>`;
const dtReplace = `            <div className="space-y-4 text-xs">
              
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
code = code.replace(dtSearch, dtReplace);

// 2. Restore Payment Methods
const pmSearch = `                <label className="block text-stone-600 font-semibold mb-2 uppercase tracking-wide font-mono text-[10px]">Cổng thanh toán liên kết</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedPayment('zalopay')}`;
const pmReplace = `                <label className="block text-stone-600 font-semibold mb-2 uppercase tracking-wide font-mono text-[10px]">Cổng thanh toán liên kết</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedPayment('momo')}
                    className={\`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer \${selectedPayment === 'momo' ? 'border-[#a50064] bg-[#a50064]/5 text-[#a50064] font-bold' : 'border-stone-250 bg-stone-50 text-stone-500 hover:bg-stone-100 font-medium'}\`}
                  >
                    <span className="w-5 h-5 bg-[#a50064] rounded-full text-white flex items-center justify-center text-[10px] font-extrabold mb-1">M</span>
                    <span className="text-[10px]">MOMO API</span>
                  </button>

                  <button
                    onClick={() => setSelectedPayment('zalopay')}`;
code = code.replace(pmSearch, pmReplace);

// 3. Restore Modal 2 completely
const m2Search = `            <button
              onClick={executeCheckout}
              className="w-full mt-6 py-3 bg-[#8a6538] hover:bg-[#6c4d29] text-white font-bold text-xs uppercase tracking-widest rounded-xl cursor-pointer shadow-xs transition-colors"
            >
              Xác nhận Đặt hàng & Ship ngay
            </button>
          </div>
            ) : (
              // --- THE NEW ADVANCED OFFICIAL / SIMULATED SANDBOX FLOW ---
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">`;
const m2Replace = `            <button
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
            ) : (
              // --- THE NEW ADVANCED OFFICIAL / SIMULATED SANDBOX FLOW ---
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">`;
code = code.replace(m2Search, m2Replace);

// 4. Update the Sandbox placeholder to a QR code
const qrSearch = `                        {sandboxPayUrl && sandboxPayUrl !== '#' ? (
                          <div className="w-full space-y-2.5">
                            <div className="w-32 h-32 border border-stone-150 rounded-xl p-1.5 bg-white flex items-center justify-center mx-auto shadow-sm relative">
                              <img src={\`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=\${encodeURIComponent(sandboxPayUrl)}\`} alt="QR Code Sandbox" className="w-full h-full object-contain rounded-lg" />
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-0.5 rounded-full shadow-sm">
                                {paymentQRModal.method === 'momo' ? (
                                  <div className="w-6 h-6 bg-[#a50064] text-white rounded-full flex items-center justify-center text-[9px] font-bold">M</div>
                                ) : (
                                  <div className="w-6 h-6 bg-[#0068ff] text-white rounded-full flex items-center justify-center text-[9px] font-bold">Z</div>
                                )}
                              </div>
                            </div>
                            <a
                              href={sandboxPayUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-bold uppercase rounded-lg text-center transition-all inline-flex items-center justify-center space-x-1 shadow-sm font-sans"
                            >
                              <span>Hoặc bấm thanh toán Sandbox từ ví thực ↗</span>
                            </a>
                          </div>
                        ) : (
                          <div className="w-full space-y-2.5">
                            <div className="w-28 h-28 border border-stone-150 rounded-lg p-3 bg-stone-50 flex items-center justify-center mx-auto">
                              {paymentQRModal.method === 'momo' ? (
                                <div className="text-center space-y-1 bg-white p-2 border border-pink-200 rounded-md">
                                  <span className="text-[16px] block font-black text-[#a50064] leading-none">MOMO</span>
                                  <span className="text-[8px] font-mono text-stone-400 block tracking-tighter">SANDBOX</span>
                                </div>
                              ) : (
                                <div className="text-center space-y-1 bg-white p-2 border border-blue-200 rounded-md">
                                  <span className="text-[16px] block font-black text-[#0068ff] leading-none">ZALO</span>
                                  <span className="text-[8px] font-mono text-stone-400 block tracking-tighter">SANDBOX</span>
                                </div>
                              )}
                            </div>
                            <div className="text-center py-1.5 px-2.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-lg border border-amber-200">
                              Không nhận được link chuyển hướng Sandbox từ Cổng API
                            </div>
                          </div>
                        )}`;
const qrReplace = `                        {sandboxPayUrl && sandboxPayUrl !== '#' ? (
                          <div className="w-full space-y-2.5">
                            <div className="w-32 h-32 border border-stone-150 rounded-xl p-1.5 bg-white flex items-center justify-center mx-auto shadow-sm relative">
                              <img src={\`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=\${encodeURIComponent(sandboxPayUrl)}\`} alt="QR Code Sandbox" className="w-full h-full object-contain rounded-lg" />
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-0.5 rounded-full shadow-sm">
                                {paymentQRModal.method === 'momo' ? (
                                  <div className="w-6 h-6 bg-[#a50064] text-white rounded-full flex items-center justify-center text-[9px] font-bold">M</div>
                                ) : (
                                  <div className="w-6 h-6 bg-[#0068ff] text-white rounded-full flex items-center justify-center text-[9px] font-bold">Z</div>
                                )}
                              </div>
                            </div>
                            <a
                              href={sandboxPayUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-bold uppercase rounded-lg text-center transition-all inline-flex items-center justify-center space-x-1 shadow-sm font-sans"
                            >
                              <span>Hoặc bấm thanh toán Sandbox từ ví thực ↗</span>
                            </a>
                          </div>
                        ) : (
                          <div className="w-full space-y-2.5">
                            <div className="w-28 h-28 border border-stone-150 rounded-lg p-3 bg-stone-50 flex items-center justify-center mx-auto">
                              {paymentQRModal.method === 'momo' ? (
                                <div className="text-center space-y-1 bg-white p-2 border border-pink-200 rounded-md">
                                  <span className="text-[16px] block font-black text-[#a50064] leading-none">MOMO</span>
                                  <span className="text-[8px] font-mono text-stone-400 block tracking-tighter">SANDBOX</span>
                                </div>
                              ) : (
                                <div className="text-center space-y-1 bg-white p-2 border border-blue-200 rounded-md">
                                  <span className="text-[16px] block font-black text-[#0068ff] leading-none">ZALO</span>
                                  <span className="text-[8px] font-mono text-stone-400 block tracking-tighter">SANDBOX</span>
                                </div>
                              )}
                            </div>
                            <div className="text-center py-1.5 px-2.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-lg border border-amber-200">
                              Không nhận được link chuyển hướng Sandbox từ Cổng API
                            </div>
                          </div>
                        )}`;
code = code.replace(qrSearch, qrReplace);

fs.writeFileSync('src/App.tsx', code);
console.log('Successfully repaired App.tsx');
