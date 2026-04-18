/* ============================================================
   1. القواعد والبيانات الأساسية (Data Structure)
   ============================================================ */
let products = [];
let types = [];
let invoice = [];
let allInvoices = [];

try {
    products = JSON.parse(localStorage.getItem("products")) || [];
    types = JSON.parse(localStorage.getItem("types")) || [];
    allInvoices = JSON.parse(localStorage.getItem("allInvoices")) || [];
    
    // استعادة الفاتورة المعلقة (في حالة التعديل أو الانقطاع)
    let editingData = localStorage.getItem("editingInvoice");
    if (editingData) invoice = JSON.parse(editingData);
} catch(e) {
    console.error("خطأ في تحميل البيانات من LocalStorage:", e);
    products = []; types = ["جراب","شاحن"]; allInvoices = [];
}

/* ============================================================
   2. نظام الدخول والحماية (Auth & Core)
   ============================================================ */
function login(){
    let user = document.getElementById("username")?.value.trim();
    let pass = document.getElementById("password")?.value.trim();
let savedPass = localStorage.getItem("password") || "1234";

if(user === (localStorage.getItem("savedUser") || "admin") && pass === savedPass){
        localStorage.setItem("loggedIn","true");
        localStorage.setItem("savedUser", user);
        location.reload();
    } else { 
        alert("خطأ في اسم المستخدم أو كلمة السر ❌"); 
    }
}

function logout(){
    if(confirm("هل تريد الخروج من النظام؟")){
        localStorage.removeItem("loggedIn");
        location.reload();
    }
}

function go(page){ window.location = page; }
function saveAll(){ localStorage.setItem("products", JSON.stringify(products)); }

/* ============================================================
   3. التشغيل عند التحميل (Initialization)
   ============================================================ */
// ابحث عن الجزء ده في script.js وزود السطر المكتوب عليه (إضافة)
window.onload = function(){
    let isLogged = localStorage.getItem("loggedIn");
    if(document.getElementById("loginBox") && document.getElementById("home")){
        if(isLogged === "true"){
            document.getElementById("loginBox").style.display = "none";
            document.getElementById("home").style.display = "block";
            updateDailyStats(); 
        }
    }

    if(document.getElementById("type")) loadTypes();
    if(document.getElementById("saleType")) loadTypesToSale();
    if(document.getElementById("searchType")) loadTypesSearch();
    
    // تأكد من وجود السطر ده عشان المنتجات تظهر في صفحة البحث (المخزن)
    if(document.getElementById("productsList")) renderProducts(""); 

    if(document.getElementById("invoice")) showInvoicesByDate();
    if(document.getElementById("invoiceList")) renderInvoice();
    if(document.getElementById("expensesList")) renderExpenses();
if(document.getElementById("netProfit")) loadReports();
if(document.getElementById("expType")) loadExpenseTypes();
if(document.getElementById("expensesList")) renderExpenses();
if(document.getElementById("expensesList")) showExpensesByDate();


    enableSearchInSelects(); 
};
/* ============================================================
   4. نظام الإحصائيات (الداشبورد) وحساب الأرباح
   ============================================================ */
function updateDailyStats() {
    let today = new Date().toLocaleDateString();
    let dailySales = 0;
    let dailyProfit = 0;
    let outOfStock = 0;

    // حساب النواقص (المنتجات التي نفدت كميتها)
    products.forEach(p => { if(p.quantity <= 0) outOfStock++; });

    // حساب إجمالي مبيعات وأرباح اليوم الحالي
    allInvoices.forEach(inv => {
        let invDate = new Date(inv.time).toLocaleDateString();
        if(invDate === today) {
            inv.items.forEach(item => {
                dailySales += item.price;
                // جلب تكلفة المنتج لحساب الربح الصافي
                let productRef = products.find(x => x.name === item.name);
                if(productRef) {
                    dailyProfit += (item.price - productRef.cost);
                }
            });
        }
    });

    // تحديث الأرقام في صفحة index.html
    if(document.getElementById("totalSalesToday")) 
        document.getElementById("totalSalesToday").innerText = dailySales + " ج";
    
    if(document.getElementById("totalProfitToday")) 
        document.getElementById("totalProfitToday").innerText = dailyProfit + " ج";
        
    if(document.getElementById("outOfStockCount")) 
        document.getElementById("outOfStockCount").innerText = outOfStock;
}

/* ============================================================
   5. إضافة المنتجات والمخزن (Inventory)
   ============================================================ */
function addProduct(){
    let name = document.getElementById("name").value.trim();
    let barcode = document.getElementById("barcode")?.value || Date.now();
    let cost = document.getElementById("costPrice").value;
    let price = document.getElementById("sellPrice").value;
    let qty = document.getElementById("quantity").value;
    let type = document.getElementById("type").value;

    if(!name || !cost || !price || !qty){ alert("برجاء إكمال كافة البيانات ❌"); return; }
    
    products.push({ 
        name, 
        barcode, 
        cost: Number(cost), 
        price: Number(price), 
        quantity: Number(qty), 
        type 
    });
    
    saveAll();
    alert("تمت إضافة المنتج بنجاح ✅");
    go('index.html');
}

function renderProducts(val = ""){
    let list = document.getElementById("productsList");
    if(!list) return;

    let filtered = products.filter(p => 
        p.name.toLowerCase().includes(val.toLowerCase()) || 
        (p.barcode && p.barcode.toString().includes(val))
    );

    list.innerHTML = filtered.map((p, i) => {
        let realIdx = products.findIndex(x => x.name === p.name);
        return `
        <div class="card" style="border-right: 5px solid red; background:#111; margin:10px auto; padding:15px; border-radius:10px;">
            <p style="font-size:18px;"><b>📱 ${p.name}</b></p>
            <p>الباركود: ${p.barcode} | النوع: ${p.type}</p>
            <p>التكلفة: ${p.cost}ج | البيع: <span style="color:red">${p.price}ج</span></p>
            <p>الكمية المتاحة: <span style="color:red">${p.quantity}</span></p>
            <div style="margin-top:10px;">
                <button onclick="editProduct(${realIdx})" style="background:blue; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer;">تعديل ✏️</button>
                <button onclick="deleteProduct(${realIdx})" style="background:#444; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer; margin-right:5px;">حذف ❌</button>
            </div>
        </div>`;
    }).join("");
}

function editProduct(i){
    let p = products[i];
    let nP = prompt("سعر البيع الجديد؟", p.price);
    let nQ = prompt("الكمية الحالية في المخزن؟", p.quantity);
    let nC = prompt("سعر الشراء (التكلفة)؟", p.cost);
    
    if(nP !== null) p.price = Number(nP);
    if(nQ !== null) p.quantity = Number(nQ);
    if(nC !== null) p.cost = Number(nC);
    
    saveAll();
    renderProducts("");
    updateDailyStats();
}

function deleteProduct(i){
    if(confirm("هل تريد حذف هذا المنتج نهائياً؟ لا يمكن التراجع!")){
        products.splice(i,1);
        saveAll();
        renderProducts("");
        updateDailyStats();
    }
}

/* ============================================================
   6. نظام البيع المتكامل والطباعة (Sales & Printing)
   ============================================================ */
function loadTypesToSale(){
    let st = document.getElementById("saleType");
    if(!st) return;
    st.innerHTML = types.map(t => `<option>${t}</option>`).join("");
    loadProductsByType();
}

function loadProductsByType(){
    let pl = document.getElementById("productList");
    if(!pl) return;
    let selectedType = document.getElementById("saleType").value;
    let filtered = products.filter(p => p.type === selectedType);
    pl.innerHTML = filtered.map(p => `<option>${p.name}</option>`).join("");
    showPrice();
}

function showPrice(){
    let selectedName = document.getElementById("productList").value;
    let p = products.find(x => x.name === selectedName);
    if(p) {
        document.getElementById("salePrice").value = p.price;
        if(document.getElementById("availableQty")) {
            document.getElementById("availableQty").innerText = "المتاح: " + p.quantity;
            document.getElementById("availableQty").style.color = p.quantity > 0 ? "green" : "red";
        }
    }
}

function addToInvoice(){
    let selectedName = document.getElementById("productList").value;
    let p = products.find(x => x.name === selectedName);
    
    if(!p || p.quantity <= 0){ 
        alert("الكمية غير كافية في المخزن ❌"); 
        return; 
    }
    
    p.quantity--; 
    invoice.push({ 
        name: p.name, 
        price: Number(document.getElementById("salePrice").value) 
    });
    
    localStorage.setItem("editingInvoice", JSON.stringify(invoice));
    saveAll();
    renderInvoice();
}

function renderInvoice(){
    let list = document.getElementById("invoiceList");
    if(!list) return;
    let total = 0;
    list.innerHTML = invoice.map((item, idx) => {
        total += item.price;
        return `
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid #333; padding:10px; color:white;">
            <span>${item.name} - ${item.price}ج</span>
            <span onclick="removeFromInv(${idx})" style="color:red; cursor:pointer; font-weight:bold;">حذف</span>
        </div>`;
    }).join("");
    
    if(document.getElementById("totalText")) 
        document.getElementById("totalText").innerText = "إجمالي الفاتورة: " + total + " ج";
}

function removeFromInv(i){
    let item = invoice[i];
    let p = products.find(x => x.name === item.name);
    if(p) p.quantity++; 
    
    invoice.splice(i,1);
    localStorage.setItem("editingInvoice", JSON.stringify(invoice));
    saveAll();
    renderInvoice();
}

// دالة الطباعة اللحظية أثناء البيع
function printCurrentInvoice(){
    if(invoice.length === 0) { alert("الفاتورة فارغة للطباعة!"); return; }
    localStorage.setItem("lastInvoice", JSON.stringify(invoice));
    window.open("print.html");
}

function confirmSale(){
    if(invoice.length === 0) { alert("أضف منتجات أولاً!"); return; }
    
    let currentTotal = invoice.reduce((sum, item) => sum + item.price, 0);
    allInvoices.push({ 
        items: [...invoice], 
        time: new Date().toString(),
        total: currentTotal
    });
    
    let indexToUpdate = localStorage.getItem("indexToUpdate");
    if(indexToUpdate !== null) {
        allInvoices.splice(parseInt(indexToUpdate), 1);
        localStorage.removeItem("indexToUpdate");
    }
    
    localStorage.setItem("allInvoices", JSON.stringify(allInvoices));
    localStorage.removeItem("editingInvoice");
    invoice = []; 
    saveAll();
    
    alert("تم تأكيد وحفظ الفاتورة ✅");
    go('index.html');
}

/* ============================================================
   7. سجل الفواتير الشامل (History & Reports)
   ============================================================ */
function loadAllInvoices(){
    let invDiv = document.getElementById("invoice");
    if(!invDiv) return;
    
    if(allInvoices.length === 0) {
        invDiv.innerHTML = "<p style='text-align:center; padding:20px;'>لا يوجد فواتير مسجلة حالياً</p>";
        return;
    }

    invDiv.innerHTML = allInvoices.slice().reverse().map((inv, index) => {
        let realIdx = allInvoices.length - 1 - index;
        return `
        <div class="card" style="border: 1px solid red; margin:10px; padding:15px; border-radius:10px; background:#111; text-align:right;">
            <h4 style="color:white;">📅 ${new Date(inv.time).toLocaleString()}</h4>
            <p style="color:red; font-size:18px; font-weight:bold;">القيمة الإجمالية: ${inv.total || 0} ج</p>
            <div style="margin-top:10px;">
                <button onclick="editOldInvoice(${realIdx})" style="background:blue; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer;">تعديل ✏️</button>
                <button onclick="printOldInvoice(${realIdx})" style="background:green; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer; margin-right:5px;">طباعة 🧾</button>
                <button onclick="deleteInvoice(${realIdx})" style="background:#444; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer; margin-right:5px;">حذف ❌</button>
            </div>
        </div>`;
    }).join("");
}

function deleteInvoice(i){
    if(confirm("هل تريد حذف الفاتورة؟ سيتم تجاهل مبيعاتها من التقارير.")){
        allInvoices.splice(i, 1);
        localStorage.setItem("allInvoices", JSON.stringify(allInvoices));
        loadAllInvoices();
        updateDailyStats();
    }
}

function editOldInvoice(i){
    let inv = allInvoices[i];
    localStorage.setItem("editingInvoice", JSON.stringify(inv.items));
    localStorage.setItem("indexToUpdate", i);
    go('sales.html'); 
}

function printOldInvoice(i){
    localStorage.setItem("lastInvoice", JSON.stringify(allInvoices[i].items));
    window.open("print.html");
}

/* ============================================================
   8. إدارة التصنيفات (Categories) والبحث المتقدم
   ============================================================ */
function loadTypes(){
    let select = document.getElementById("type");
    if(!select) return;
    select.innerHTML = types.map(t => `<option>${t}</option>`).join("");
    if(document.getElementById("typesList")) renderTypesList();
}

function renderTypesList(){
    let list = document.getElementById("typesList");
    if(!list) return;

  // التعديل ده جوه دالة renderTypesList
list.innerHTML = types.map(t => `
    <span class="type-item">
        ${t}
        <b onclick="deleteType('${encodeURIComponent(t)}')" style="color:red; cursor:pointer; margin-right:10px;">X</b>
    </span>
`).join("");
}

function addNewType(){
    let t = prompt("أدخل اسم التصنيف الجديد (مثلاً: إكسسوارات):");
    if(t && !types.includes(t)){
        types.push(t);
        localStorage.setItem("types", JSON.stringify(types));
        loadTypes();
    }
}

function deleteType(t) {
    // فك التشفير عشان لو الاسم عربي
    t = decodeURIComponent(t);

    if(confirm("هل تريد حذف هذا التصنيف؟")) {
        // تحديث مصفوفة الأنواع
        types = types.filter(x => x !== t);
        // حفظ في الـ LocalStorage
        localStorage.setItem("types", JSON.stringify(types));
        // إعادة تحميل القائمة عشان يختفي من قدامك
        loadTypes();
    }
}

function loadTypesSearch(){
    let st = document.getElementById("searchType");
    if(!st) return;
    st.innerHTML = `<option value="">كل الأنواع</option>` + types.map(t => `<option>${t}</option>`).join("");
}

/* ============================================================
   9. الخدمات المساعدة (Utils & Search Enhancements)
   ============================================================ */
function enableSearchInSelects(){
    document.querySelectorAll("select").forEach(select => {
        if(select.previousElementSibling?.className === "select-search") return;
        
        let input = document.createElement("input");
        input.placeholder = "🔍 ابحث هنا...";
        input.className = "select-search";
        input.style.width = "90%"; 
        input.style.margin = "10px auto"; 
        input.style.display = "block";
        input.style.padding = "10px";
        input.style.borderRadius = "8px";
        input.style.border = "1px solid #444";
        input.style.background = "#222";
        input.style.color = "white";

        select.before(input);
        
        input.onkeyup = function(){
            let val = input.value.toLowerCase();
            [...select.options].forEach(opt => {
                opt.style.display = opt.text.toLowerCase().includes(val) ? "" : "none";
            });
        };
    });
}
// 🔥 FIX: توحيد الكتابة بين الأنواع (بدون تعديل الكود الأصلي)
function normalizeTypesFix(){
    products.forEach(p => {
        if(p.type){
            p.type = p.type.toString().trim().toLowerCase();
        }
    });

    types = types.map(t => t.toString().trim().toLowerCase());

    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("types", JSON.stringify(types));
}
// 🔥 تشغيل التصليح تلقائي
setTimeout(() => {
    normalizeTypesFix();
}, 500);
// 🔥 FIX: تحميل المنتجات بطريقة آمنة
function loadProductsByTypeFixed(){
    let pl = document.getElementById("productList");
    if(!pl) return;

    let selectedType = document.getElementById("saleType")?.value;
    if(!selectedType) return;

    selectedType = selectedType.toString().trim().toLowerCase();

    let filtered = products.filter(p => 
        p.type && p.type.toString().trim().toLowerCase() === selectedType
    );

    if(filtered.length === 0){
        // fallback لو مفيش مطابق
        filtered = products;
    }

    pl.innerHTML = filtered.map(p => `<option>${p.name}</option>`).join("");
}
// 🔥 FIX: ضمان تخزين الفاتورة قبل الطباعة
function printCurrentInvoiceFixed(){
    if(invoice.length === 0){ 
        alert("الفاتورة فارغة ❌"); 
        return; 
    }

    localStorage.setItem("lastInvoice", JSON.stringify(invoice));

    setTimeout(() => {
        window.open("print.html");
    }, 300);
}
// 🔥 Override زر الطباعة
setTimeout(() => {
    let btns = document.querySelectorAll("button");
    btns.forEach(btn => {
        if(btn.innerText.includes("طباعة")){
            btn.onclick = printCurrentInvoiceFixed;
        }
    });
}, 1000);
// 🔥 DEBUG
setTimeout(() => {
    console.log("Products:", products);
}, 1000);
// 🔥 إجبار عرض المنتجات
setTimeout(() => {
    if(document.getElementById("productsList")){
        renderProducts("");
    }
}, 800);
// 🔥 FIX عرض أي منتجات حتى لو الفلتر فشل
function forceRenderProducts(){
    let list = document.getElementById("productsList");
    if(!list) return;

    if(products.length === 0){
        list.innerHTML = "<h3 style='text-align:center;color:red'>❌ لا يوجد منتجات في المخزن</h3>";
        return;
    }

    list.innerHTML = products.map((p) => `
        <div style="background:#111;padding:15px;margin:10px;border-radius:10px;border-right:5px solid red;">
            <h3>${p.name}</h3>
            <p>النوع: ${p.type}</p>
            <p>السعر: ${p.price} ج</p>
            <p>الكمية: ${p.quantity}</p>
        </div>
    `).join("");
}
// 🔥 FORCE LOAD + عرض المنتجات + تعديل + حذف
window.addEventListener("load", () => {
    setTimeout(() => {
        let list = document.getElementById("productsList");

        if (!list) return;

        let data = JSON.parse(localStorage.getItem("products")) || [];

        if (data.length === 0) {
            list.innerHTML = `
                <h2 style="text-align:center;color:red;margin-top:50px;">
                    ❌ مفيش منتجات في المخزن
                </h2>
            `;
            return;
        }

        list.innerHTML = data.map((p, index) => `
            <div style="background:#111;padding:15px;margin:10px;border-radius:10px;border-right:5px solid red;">
                <h3>${p.name}</h3>
                <p>النوع: ${p.type}</p>
                <p>السعر: ${p.price} ج</p>
                <p>الكمية: ${p.quantity}</p>

                <div style="margin-top:10px;">
                    <button onclick="editProductFixed(${index})"
                        style="background:blue;color:white;border:none;padding:8px 15px;border-radius:5px;cursor:pointer;">
                        تعديل ✏️
                    </button>

                    <button onclick="deleteProductFixed(${index})"
                        style="background:red;color:white;border:none;padding:8px 15px;border-radius:5px;cursor:pointer;margin-right:5px;">
                        حذف ❌
                    </button>
                </div>
            </div>
        `).join("");

    }, 700);
});


// 🔥 تعديل المنتج
function editProductFixed(index){
    let data = JSON.parse(localStorage.getItem("products")) || [];
    let p = data[index];

    if(!p){
        alert("في مشكلة في المنتج ❌");
        return;
    }

    let newPrice = prompt("السعر الجديد:", p.price);
    let newQty = prompt("الكمية الجديدة:", p.quantity);
    let newCost = prompt("سعر الشراء:", p.cost);

    if(newPrice !== null && newPrice !== "") p.price = Number(newPrice);
    if(newQty !== null && newQty !== "") p.quantity = Number(newQty);
    if(newCost !== null && newCost !== "") p.cost = Number(newCost);

    localStorage.setItem("products", JSON.stringify(data));

    alert("تم التعديل بنجاح ✅");

    location.reload();
}


// 🔥 حذف المنتج
function deleteProductFixed(index){
    let data = JSON.parse(localStorage.getItem("products")) || [];

    if(!data[index]){
        alert("المنتج مش موجود ❌");
        return;
    }

    if(confirm("هل أنت متأكد من حذف المنتج؟ ❗")){
        data.splice(index, 1);
        localStorage.setItem("products", JSON.stringify(data));

        alert("تم حذف المنتج ✅");

        location.reload();
    }
}
// فتح وقفل القائمة
function toggleProfileMenu(){
    let menu = document.getElementById("profileMenu");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}

// فتح صفحة البروفايل
function openProfile(){
    window.location = "profile.html";
}

// تحميل بيانات البروفايل
window.addEventListener("load", () => {
    let img = localStorage.getItem("profileImage");
    let savedUser = localStorage.getItem("savedUser");

    if(document.getElementById("profileImg") && img){
        document.getElementById("profileImg").src = img;
    }

    if(document.getElementById("userImage") && img){
        document.getElementById("userImage").src = img;
    }

    if(document.getElementById("newUsername") && savedUser){
        document.getElementById("newUsername").value = savedUser;
    }
});

// تغيير الصورة
function changeImage(event){
    let reader = new FileReader();
    reader.onload = function(){
        localStorage.setItem("profileImage", reader.result);
        document.getElementById("userImage").src = reader.result;
    };
    reader.readAsDataURL(event.target.files[0]);
}

// حفظ التعديلات
function saveProfile(){
    let newUser = document.getElementById("newUsername").value;
    let newPass = document.getElementById("newPassword").value;

    if(newUser){
        localStorage.setItem("savedUser", newUser);
    }

    if(newPass){
        localStorage.setItem("password", newPass);
    }

    alert("تم حفظ التعديلات ✅");

    // 🔥 تسجيل خروج + الرجوع لصفحة اللوجين
    localStorage.removeItem("loggedIn");

    window.location.href = "index.html"; // غير الاسم لو صفحتك اسمها مختلف
}
function showInvoicesByDate(date = null){
    let invDiv = document.getElementById("invoice");
    if(!invDiv) return;

    let targetDate;

    if(!date){
        targetDate = new Date().toISOString().split("T")[0]; // النهارده
    } else {
        targetDate = date;
    }

    let filtered = allInvoices.filter(inv => {
        let invDate = new Date(inv.time).toISOString().split("T")[0];
        return invDate === targetDate;
    });

    if(filtered.length === 0){
        invDiv.innerHTML = "<h3 style='text-align:center;color:red;'>❌ لا يوجد فواتير</h3>";
        document.getElementById("dailyTotal").innerText = "";
        return;
    }

    let total = 0;

    invDiv.innerHTML = filtered.map((inv) => {
        let realIdx = allInvoices.indexOf(inv); // مهم للتعديل والحذف

        total += inv.total || 0;

        return `
        <div style="background:#111;padding:15px;margin:10px;border-radius:10px;border:1px solid red;text-align:right;">
            <h4>📅 ${new Date(inv.time).toLocaleString()}</h4>
            <p style="color:red;font-weight:bold;">الإجمالي: ${inv.total} ج</p>

            <div style="margin-top:10px;">
                <button onclick="editOldInvoice(${realIdx})"
                    style="background:blue;color:white;border:none;padding:8px 15px;border-radius:5px;cursor:pointer;">
                    تعديل ✏️
                </button>

                <button onclick="printOldInvoice(${realIdx})"
                    style="background:green;color:white;border:none;padding:8px 15px;border-radius:5px;cursor:pointer;margin-right:5px;">
                    طباعة 🧾
                </button>

                <button onclick="deleteInvoice(${realIdx})"
                    style="background:#444;color:white;border:none;padding:8px 15px;border-radius:5px;cursor:pointer;margin-right:5px;">
                    حذف ❌
                </button>
            </div>
        </div>
        `;
    }).join("");

    document.getElementById("dailyTotal").innerText =
        "💰 إجمالي المبيعات: " + total + " ج";
}
function filterInvoicesByDate(){
    let selectedDate = document.getElementById("searchDate").value;

    if(!selectedDate){
        showInvoicesByDate(); // يرجع لليوم الحالي
        return;
    }

    showInvoicesByDate(selectedDate);
}
    let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

function addExpense(){
    let name = document.getElementById("expName").value;
    let amount = Number(document.getElementById("expAmount").value);

    if(!name || !amount){
        alert("كمل البيانات ❌");
        return;
    }

    expenses.push({
        name,
        amount,
        time: new Date().toString()
    });

    localStorage.setItem("expenses", JSON.stringify(expenses));

    renderExpenses();
}

function renderExpenses(){
    let list = document.getElementById("expensesList");
    if(!list) return;

    let total = 0;

    list.innerHTML = expenses.map((e,i)=>{
        total += e.amount;

        return `
        <div style="background:#222;padding:10px;margin:10px;border-radius:10px;">
            ${e.name} - ${e.amount} ج
            <span onclick="deleteExpense(${i})" style="color:red;cursor:pointer;">❌</span>
        </div>
        `;
    }).join("");

    document.getElementById("totalExpenses").innerText =
        "إجمالي المصروفات: " + total + " ج";
}

function deleteExpense(i){
    expenses.splice(i,1);
    localStorage.setItem("expenses", JSON.stringify(expenses));
    renderExpenses();
}
function loadReports(){
    let totalSales = 0;
    let totalCost = 0;

    allInvoices.forEach(inv=>{
        inv.items.forEach(item=>{
            totalSales += item.price;

            let p = products.find(x=>x.name === item.name);
            if(p){
                totalCost += p.cost;
            }
        });
    });

    let totalExpenses = expenses.reduce((sum,e)=>sum+e.amount,0);

    let netProfit = totalSales - totalCost - totalExpenses;

    document.getElementById("totalSales").innerText =
        "💵 إجمالي المبيعات: " + totalSales + " ج";

    document.getElementById("totalCost").innerText =
        "📦 تكلفة البضاعة: " + totalCost + " ج";

    document.getElementById("totalExpensesView").innerText =
        "🧾 المصروفات: " + totalExpenses + " ج";

    document.getElementById("netProfit").innerText =
        "🔥 صافي الربح: " + netProfit + " ج";
}
let expenseTypes = JSON.parse(localStorage.getItem("expenseTypes")) || [];
function loadExpenseTypes(){
    let select = document.getElementById("expType");
    if(!select) return;

    select.innerHTML = expenseTypes.map(t => `<option>${t}</option>`).join("");
}
function searchExpenseType(){
    let val = document.getElementById("searchExp").value.toLowerCase();
    let select = document.getElementById("expType");

    [...select.options].forEach(opt=>{
        opt.style.display = opt.text.toLowerCase().includes(val) ? "" : "none";
    });
}
let tempExpenses = [];

function addExpense(){
    let type = document.getElementById("expType").value;
    let amount = Number(document.getElementById("expAmount").value);

    if(!type || !amount){
        alert("كمل البيانات ❌");
        return;
    }

    tempExpenses.push({
        name: type,
        amount
    });

    renderTempExpenses();
}
function renderTempExpenses(){
    let list = document.getElementById("expensesList");

    let total = 0;

    list.innerHTML = tempExpenses.map((e,i)=>{
        total += e.amount;

        return `
        <div style="background:#222;padding:10px;margin:10px;border-radius:10px;">
            ${e.name} - ${e.amount} ج
            <span onclick="removeTempExpense(${i})" style="color:red;cursor:pointer;">❌</span>
        </div>
        `;
    }).join("");

    document.getElementById("totalExpenses").innerText =
        "الإجمالي: " + total + " ج";
}
function removeTempExpense(i){
    tempExpenses.splice(i,1);
    renderTempExpenses();
}


function saveExpenses(){
    if(tempExpenses.length === 0){
        alert("مفيش مصروفات ❌");
        return;
    }

    tempExpenses.forEach(e=>{
        expenses.push({
            ...e,
            time: new Date().toString()
        });
    });

    localStorage.setItem("expenses", JSON.stringify(expenses));

    tempExpenses = [];

    alert("تم الحفظ ✅");

    go('index.html');
}
function loadExpenseTypes(){
    let select = document.getElementById("expType");
    if(!select) return;

    select.innerHTML = expenseTypes.map(t => `<option>${t}</option>`).join("");

    renderExpenseTypes();
}
function addNewExpenseType(){
    let t = prompt("اكتب نوع المصروف الجديد:");

    if(t && !expenseTypes.includes(t)){
        expenseTypes.push(t);
        localStorage.setItem("expenseTypes", JSON.stringify(expenseTypes));
        loadExpenseTypes();
    }
}
function deleteExpenseType(t){
    if(confirm("هل تريد حذف نوع المصروف؟")){
        expenseTypes = expenseTypes.filter(x => x !== t);
        localStorage.setItem("expenseTypes", JSON.stringify(expenseTypes));
        loadExpenseTypes();
    }
}
function renderExpenseTypes(){
    let list = document.getElementById("typesList");
    if(!list) return;

    list.innerHTML = expenseTypes.map(t => `
        <span style="display:inline-block;background:#222;padding:8px;margin:5px;border:1px solid red;border-radius:5px;">
            ${t}
            <b onclick="deleteExpenseType('${encodeURIComponent(t)}')" 
               style="color:red;cursor:pointer;margin-left:8px;">
               X
            </b>
        </span>
    `).join("");
}
function searchExpenseType(){
    let val = document.getElementById("searchExp").value.toLowerCase();
    let select = document.getElementById("expType");

    [...select.options].forEach(opt => {
        opt.style.display = opt.text.toLowerCase().includes(val) ? "" : "none";
    });
}
if(document.getElementById("expType")) loadExpenseTypes();
function renderExpenses(){
    let list = document.getElementById("expensesList");
    if(!list) return;

    let data = JSON.parse(localStorage.getItem("expenses")) || [];

    if(data.length === 0){
        list.innerHTML = "<h3 style='color:red;text-align:center;'>❌ لا يوجد مصروفات</h3>";
        return;
    }

    let total = 0;

    list.innerHTML = data.map((e, index) => {
        total += e.amount;

        return `
        <div style="background:#111;padding:15px;margin:10px;border-radius:10px;border:1px solid red;">
            
            <h3>${e.name}</h3>
            <p>💰 ${e.amount} ج</p>
            <p>📅 ${new Date(e.time).toLocaleString()}</p>

            <div style="margin-top:10px;">
                <button onclick="editExpense(${index})" style="background:blue;">تعديل ✏️</button>
                <button onclick="deleteExpense(${index})" style="background:red;">حذف ❌</button>
            </div>

        </div>
        `;
    }).join("");

    list.innerHTML += `<h3 style="color:red;text-align:center;">الإجمالي: ${total} ج</h3>`;
}
function editExpense(index){
    let data = JSON.parse(localStorage.getItem("expenses")) || [];
    let e = data[index];

    let newAmount = prompt("المبلغ الجديد:", e.amount);

    if(newAmount !== null && newAmount !== ""){
        e.amount = Number(newAmount);
    }

    localStorage.setItem("expenses", JSON.stringify(data));

    alert("تم التعديل ✅");

    renderExpenses();
}
function deleteExpense(index){
    let data = JSON.parse(localStorage.getItem("expenses")) || [];

    if(confirm("هل تريد حذف المصروف؟")){
        data.splice(index,1);
        localStorage.setItem("expenses", JSON.stringify(data));

        alert("تم الحذف ✅");

        renderExpenses();
    }
}
function showExpensesByDate(date = null){
    let list = document.getElementById("expensesList");
    if(!list) return;

    let data = JSON.parse(localStorage.getItem("expenses")) || [];

    let targetDate = date || new Date().toISOString().split("T")[0];

    let filtered = data.filter(e => {
        let d = new Date(e.time).toISOString().split("T")[0];
        return d === targetDate;
    });

    if(filtered.length === 0){
        list.innerHTML = "<h3 style='color:red;text-align:center;'>❌ لا يوجد مصروفات</h3>";
        document.getElementById("totalExpenses").innerText = "";
        return;
    }

    let total = 0;

    list.innerHTML = filtered.map((e, index) => {
        let realIndex = data.indexOf(e); // مهم علشان الحذف والتعديل

        total += e.amount;

        return `
        <div style="background:#111;padding:15px;margin:10px;border-radius:10px;border:1px solid red;">
            <h3>${e.name}</h3>
            <p>💰 ${e.amount} ج</p>
            <p>📅 ${new Date(e.time).toLocaleString()}</p>

            <div style="margin-top:10px;">
                <button onclick="editExpense(${realIndex})" style="background:blue;">تعديل ✏️</button>
                <button onclick="deleteExpense(${realIndex})" style="background:red;">حذف ❌</button>
            </div>
        </div>
        `;
    }).join("");

    document.getElementById("totalExpenses").innerText =
        "💰 إجمالي المصروفات: " + total + " ج";
}
function filterExpensesByDate(){
    let selectedDate = document.getElementById("searchExpDate").value;

    if(!selectedDate){
        showExpensesByDate(); // يرجع لليوم الحالي
        return;
    }

    showExpensesByDate(selectedDate);
}
function deleteExpenseType(type){
    if(confirm("هل تريد حذف نوع المصروف؟")){
        expenseTypes = expenseTypes.filter(t => t !== type);

        localStorage.setItem("expenseTypes", JSON.stringify(expenseTypes));

        loadExpenseTypes(); // إعادة تحميل القائمة
    }
}
function deleteExpenseType(t){
    if(confirm("هل تريد حذف نوع المصروف؟")){
        expenseTypes = expenseTypes.filter(x => x !== t);
        localStorage.setItem("expenseTypes", JSON.stringify(expenseTypes));
        loadExpenseTypes();
    }
}
function deleteExpenseType(t){
    t = decodeURIComponent(t);

    if(confirm("هل تريد حذف نوع المصروف؟")){
        expenseTypes = expenseTypes.filter(x => x !== t);
        localStorage.setItem("expenseTypes", JSON.stringify(expenseTypes));
        loadExpenseTypes();
    }
}
function renderExpenseTypes(){
    let list = document.getElementById("expenseTypesList");
    if(!list) return;

    list.innerHTML = expenseTypes.map(t => `
        <span style="
            display:inline-block;
            background:#222;
            padding:8px;
            margin:5px;
            border:1px solid red;
            border-radius:5px;
            color:white;
        ">
            ${t}
            <b onclick="deleteExpenseType('${encodeURIComponent(t)}')" 
               style="color:red;cursor:pointer;margin-left:8px;">
               X
            </b>
        </span>
    `).join("");
}
function deleteExpenseType(t){
    t = decodeURIComponent(t);

    if(confirm("هل تريد حذف نوع المصروف؟")){
        expenseTypes = expenseTypes.filter(x => x !== t);
        localStorage.setItem("expenseTypes", JSON.stringify(expenseTypes));

        loadExpenseTypes(); // تحديث القائمة
    }
}
function loadExpenseTypes(){
    let select = document.getElementById("expType");
    if(!select) return;

    select.innerHTML = expenseTypes.map(t => `<option>${t}</option>`).join("");

    renderExpenseTypes(); // 🔥 مهم جدًا
}
/* ============================================================
   إضافة ميزة البحث والبيع التلقائي بالباركود
   ============================================================ */

function checkBarcode(code) {
    let status = document.getElementById("barcodeStatus");
    if (!code) {
        status.innerText = "";
        return;
    }

    // البحث عن المنتج الذي يطابق الباركود المدخل
    let product = products.find(p => p.barcode && p.barcode.toString() === code.trim());

    if (product) {
        if (product.quantity <= 0) {
            status.style.color = "red";
            status.innerText = "❌ المنتج موجود ولكن الكمية نفدت!";
            return;
        }

        // إضافة المنتج للفاتورة تلقائياً
        addToInvoiceFromBarcode(product);
        
        // مسح الحقل للاستعداد للمنتج التالي وتنبيه المستخدم
        document.getElementById("barcodeInput").value = "";
        status.style.color = "green";
        status.innerText = "✅ تم إضافة: " + product.name;
        
        // تصفير التنبيه بعد ثانيتين
        setTimeout(() => { status.innerText = ""; }, 2000);
    } else {
        status.style.color = "yellow";
        status.innerText = "🔍 جاري البحث عن الباركود...";
    }
}

// دالة وسيطة للإضافة من الباركود لضمان عدم تكرار الأكواد
function addToInvoiceFromBarcode(p) {
    p.quantity--; // تقليل الكمية في المخزن مؤقتاً
    
    invoice.push({ 
        name: p.name, 
        price: Number(p.price) 
    });
    
    // حفظ الفاتورة المعلقة وتحديث العرض
    localStorage.setItem("editingInvoice", JSON.stringify(invoice));
    saveAll();
    renderInvoice();
}