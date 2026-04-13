const STORAGE_KEY = 'calculadora_custo_produtos';

let products = [];
let currentIngredients = [];
let editingProductId = null;

function init() {
    loadProducts();
    setupEventListeners();
    renderProducts();
    updateTotal();
}

function loadProducts() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        products = JSON.parse(saved);
    }
}

function saveProducts() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function setupEventListeners() {
    document.getElementById('addIngredientBtn').addEventListener('click', addIngredient);
    document.getElementById('saveProductBtn').addEventListener('click', handleSaveProduct);
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('profitMargin').addEventListener('input', updateTotal);
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            switchTab(tab);
        });
    });

    document.getElementById('productName').addEventListener('input', updateTotal);
}

function switchTab(tab) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    if (tab === 'calculator') {
        document.querySelector('.product-form').style.display = 'block';
        document.querySelector('.products-list').style.display = 'none';
    } else {
        document.querySelector('.product-form').style.display = 'none';
        document.querySelector('.products-list').style.display = 'block';
    }
}

const UNITS = {
    kg: { label: 'Kg', factor: 1000 },
    g: { label: 'g', factor: 1 },
    l: { label: 'L', factor: 1000 },
    ml: { label: 'ml', factor: 1 },
    un: { label: 'Un', factor: 1 }
};

function addIngredient() {
    const ingredient = {
        id: Date.now(),
        name: '',
        quantityUsed: 0,
        unitUsed: 'g',
        quantityBought: 1,
        unitBought: 'kg',
        price: 0
    };
    currentIngredients.push(ingredient);
    renderIngredients();
}

function removeIngredient(id) {
    currentIngredients = currentIngredients.filter(i => i.id !== id);
    renderIngredients();
    updateTotal();
}

function renderIngredients() {
    const list = document.getElementById('ingredientsList');
    
    if (currentIngredients.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>Nenhum ingrediente adicionado</p></div>';
        return;
    }

    const unitOptions = Object.entries(UNITS).map(([key, val]) => 
        `<option value="${key}">${val.label}</option>`
    ).join('');

    list.innerHTML = currentIngredients.map(ing => `
        <div class="ingredient-add" data-id="${ing.id}">
            <p>Ingrediente</p>
            <input type="text" placeholder="Nome" value="${ing.name}" 
                onchange="updateIngredient(${ing.id}, 'name', this.value)">
            <p>Quantidade</p>
            <input type="number" placeholder="Qtd" value="${ing.quantityUsed}" step="0.01" min="0"
                onchange="updateIngredient(${ing.id}, 'quantityUsed', parseFloat(this.value))">
            <select onchange="updateIngredient(${ing.id}, 'unitUsed', this.value)">
                ${unitOptions.replace(`value="${ing.unitUsed}"`, `value="${ing.unitUsed}" selected`)}
            </select>
            <br>
            <p>Qtd no pacote</p>
            <input type="number" placeholder="Compro" value="${ing.quantityBought}" step="0.01" min="0"
                onchange="updateIngredient(${ing.id}, 'quantityBought', parseFloat(this.value))">
            <select onchange="updateIngredient(${ing.id}, 'unitBought', this.value)">
                ${unitOptions.replace(`value="${ing.unitBought}"`, `value="${ing.unitBought}" selected`)}
            </select>
            <p>Preço do pacote</p>
            <input type="number" placeholder="R$" value="${ing.price}" step="0.01" min="0"
                onchange="updateIngredient(${ing.id}, 'price', parseFloat(this.value))">
            <button type="button" class="btn-remove" onclick="removeIngredient(${ing.id})">×</button>
        </div>
    `).join('');
}

function calculateCost(ingredient) {
    if (!ingredient.price || !ingredient.quantityUsed || !ingredient.quantityBought) {
        return 0;
    }
    
    const usedFactor = UNITS[ingredient.unitUsed]?.factor || 1;
    const boughtFactor = UNITS[ingredient.unitBought]?.factor || 1;
    
    const usedInBase = ingredient.quantityUsed * usedFactor;
    const boughtInBase = ingredient.quantityBought * boughtFactor;
    
    if (boughtInBase === 0) return 0;
    
    const pricePerUnit = ingredient.price / boughtInBase;
    return pricePerUnit * usedInBase;
}

function updateIngredient(id, field, value) {
    const ing = currentIngredients.find(i => i.id === id);
    if (ing) {
        ing[field] = value;
        updateTotal();
    }
}

function updateTotal() {
    const cost = currentIngredients.reduce((sum, ing) => {
        return sum + calculateCost(ing);
    }, 0);
    
    const margin = parseFloat(document.getElementById('profitMargin').value) || 0;
    const suggestedPrice = cost * (1 + margin / 100);
    
    document.getElementById('totalCost').textContent = formatCurrency(cost);
    document.getElementById('suggestedPrice').textContent = formatCurrency(suggestedPrice);
}

function handleSaveProduct() {
    if (editingProductId) {
        updateProduct(editingProductId);
    } else {
        saveNewProduct();
    }
}

function saveNewProduct() {
    const name = document.getElementById('productName').value.trim();
    
    if (!name) {
        alert('Digite o nome do produto');
        return;
    }

    if (currentIngredients.length === 0) {
        alert('Adicione pelo menos um ingrediente');
        return;
    }

    const totalCost = currentIngredients.reduce((sum, ing) => sum + calculateCost(ing), 0);
    const margin = parseFloat(document.getElementById('profitMargin').value) || 0;

    const product = {
        id: Date.now(),
        name: name,
        ingredients: [...currentIngredients],
        cost: totalCost,
        margin: margin,
        createdAt: new Date().toISOString()
    };

    products.push(product);
    saveProducts();
    
    resetForm();
    renderProducts();
    
    alert(`Produto "${name}" salvo com sucesso!`);
}

function resetForm() {
    document.getElementById('productName').value = '';
    document.getElementById('profitMargin').value = 30;
    currentIngredients = [];
    renderIngredients();
    updateTotal();
    document.getElementById('saveProductBtn').textContent = 'Salvar Produto';
    editingProductId = null;
}

function renderProducts() {
    const container = document.getElementById('savedProducts');
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Nenhum produto salvo ainda</p>
                <p>Calcule o custo de um produto para começar</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(prod => `
        <div class="product-card" onclick="showProductDetails(${prod.id})">
            <div class="product-card-header">
                <span class="product-card-title">${prod.name}</span>
                <span class="product-card-cost">${formatCurrency(prod.cost)}</span>
            </div>
            <div class="product-card-ingredients">
                ${prod.ingredients.length} ingrediente(s) | Margem: ${prod.margin || 30}%
            </div>
        </div>
    `).join('');
}

function showProductDetails(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');
    
    const ingredientsHtml = product.ingredients.map(ing => {
        const cost = calculateCost(ing);
        return `
        <div class="modal-ingredient">
            <span>${ing.name} (${ing.quantityUsed} ${UNITS[ing.unitUsed]?.label || ing.unitUsed})</span>
            <span>${formatCurrency(cost)}</span>
        </div>
    `}).join('');

    const suggestedPrice = product.cost * (1 + (product.margin || 30) / 100);

    modalBody.innerHTML = `
        <div id="printableContent">
            <div class="print-header">
                <h2>${product.name}</h2>
                <p class="print-date">Data: ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <div class="print-costs">
                <p><strong>Custo Total:</strong> ${formatCurrency(product.cost)}</p>
                <p><strong>Margem de Lucro:</strong> ${product.margin || 30}%</p>
                <p><strong>Preço de Venda Sugerido:</strong> ${formatCurrency(suggestedPrice)}</p>
            </div>
            <h4 style="margin-bottom: 12px; margin-top: 20px;">Ingredientes:</h4>
            <table class="print-table">
                <thead>
                    <tr>
                        <th>Ingrediente</th>
                        <th>Quantidade</th>
                        <th>Custo</th>
                    </tr>
                </thead>
                <tbody>
                    ${product.ingredients.map(ing => {
                        const cost = calculateCost(ing);
                        return `
                        <tr>
                            <td>${ing.name}</td>
                            <td>${ing.quantityUsed} ${UNITS[ing.unitUsed]?.label || ing.unitUsed}</td>
                            <td>${formatCurrency(cost)}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2"><strong>Total</strong></td>
                        <td><strong>${formatCurrency(product.cost)}</strong></td>
                    </tr>
                </tfoot>
            </table>
        </div>
        <div class="modal-actions" style="margin-top: 20px;">
            <button class="btn btn-success" onclick="printProduct(${product.id})">🖨️ Imprimir</button>
            <button class="btn btn-primary" onclick="editProduct(${product.id})">Editar</button>
            <button class="btn btn-danger" onclick="deleteProduct(${product.id})">Excluir</button>
        </div>
    `;

    modal.classList.add('active');
}

function printProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const suggestedPrice = product.cost * (1 + (product.margin || 30) / 100);
    
    const ingredientsRows = product.ingredients.map(ing => {
        const cost = calculateCost(ing);
        return `
            <tr>
                <td>${ing.name}</td>
                <td style="text-align:center">${ing.quantityUsed} ${UNITS[ing.unitUsed]?.label || ing.unitUsed}</td>
                <td style="text-align:right">${formatCurrency(cost)}</td>
            </tr>
        `;
    }).join('');

    const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${product.name} - Custo</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .print-container { max-width: 600px; margin: 0 auto; }
            .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
            .print-header h1 { font-size: 24px; margin-bottom: 5px; }
            .print-date { color: #666; font-size: 12px; }
            .print-costs { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .print-costs p { margin: 8px 0; font-size: 16px; }
            .print-costs strong { color: #2c3e50; }
            .cost-value { font-size: 20px; color: #27ae60; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #3498db; color: white; }
            tfoot td { background: #f5f5f5; font-weight: bold; }
            .print-footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            @media print { body { padding: 0; } }
        </style>
    </head>
    <body>
        <div class="print-container">
            <div class="print-header">
                <h1>${product.name}</h1>
                <p class="print-date">Data: ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <div class="print-costs">
                <p><strong>Custo do Produto:</strong> <span class="cost-value">${formatCurrency(product.cost)}</span></p>
                <p><strong>Margem de Lucro:</strong> ${product.margin || 30}%</p>
                <p><strong>Preço de Venda Sugerido:</strong> <span class="cost-value">${formatCurrency(suggestedPrice)}</span></p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Ingrediente</th>
                        <th style="text-align:center">Quantidade</th>
                        <th style="text-align:right">Custo</th>
                    </tr>
                </thead>
                <tbody>
                    ${ingredientsRows}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2"><strong>Total</strong></td>
                        <td style="text-align:right"><strong>${formatCurrency(product.cost)}</strong></td>
                    </tr>
                </tfoot>
            </table>
            <div class="print-footer">
                <p>Gerado por Calculadora de Custo de Produto</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    closeModal();
    
    document.getElementById('productName').value = product.name;
    document.getElementById('profitMargin').value = product.margin || 30;
    currentIngredients = product.ingredients.map(ing => ({
        ...ing,
        id: Date.now() + Math.random()
    }));
    
    renderIngredients();
    updateTotal();
    switchTab('calculator');
    
    editingProductId = id;
    document.getElementById('saveProductBtn').textContent = 'Atualizar Produto';
}

function deleteProduct(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        products = products.filter(p => p.id !== id);
        saveProducts();
        renderProducts();
        closeModal();
    }
}

function updateProduct(id) {
    const name = document.getElementById('productName').value.trim();
    
    if (!name) {
        alert('Digite o nome do produto');
        return;
    }

    if (currentIngredients.length === 0) {
        alert('Adicione pelo menos um ingrediente');
        return;
    }

    const totalCost = currentIngredients.reduce((sum, ing) => sum + calculateCost(ing), 0);
    const margin = parseFloat(document.getElementById('profitMargin').value) || 0;

    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) return;

    products[productIndex] = {
        id: id,
        name: name,
        ingredients: [...currentIngredients],
        cost: totalCost,
        margin: margin,
        createdAt: products[productIndex].createdAt,
        updatedAt: new Date().toISOString()
    };

    saveProducts();
    resetForm();
    renderProducts();
    
    alert(`Produto "${name}" atualizado com sucesso!`);
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

function formatCurrency(value) {
    return 'R$ ' + value.toFixed(2).replace('.', ',');
}

function getUnitLabel(unit) {
    return UNITS[unit]?.label || unit;
}

window.updateIngredient = updateIngredient;
window.removeIngredient = removeIngredient;
window.showProductDetails = showProductDetails;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.closeModal = closeModal;
window.printProduct = printProduct;

document.addEventListener('DOMContentLoaded', init);

// --- PWA INSTALL PROMPT LOGIC ---
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Previne o mini-infobar padrão do Chrome
    e.preventDefault();
    // Salva o evento para disparar mais tarde
    deferredPrompt = e;
    // Exibe a nossa interface customizada
    const installPrompt = document.getElementById('installPrompt');
    if (installPrompt) {
        installPrompt.style.display = 'block';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const installBtn = document.getElementById('installBtn');
    const closeInstallBtn = document.getElementById('closeInstallBtn');
    const installPrompt = document.getElementById('installPrompt');

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            // Esconde o painel customizado
            installPrompt.style.display = 'none';
            // Dispara o prompt de instalação
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                // Limpa o evento, pois só pode ser usado uma vez
                deferredPrompt = null;
            }
        });
    }

    if (closeInstallBtn) {
        closeInstallBtn.addEventListener('click', () => {
            installPrompt.style.display = 'none';
        });
    }
});