const productCostCalculator = (function() {
    // Store user data in local storage
    const STORAGE_KEY = 'productCostData';
    
    // Initialize with default values
    const defaultData = {
        products: []
    };
    
    // Load saved data from local storage
    function loadData() {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : defaultData;
    }
    
    // Save data to local storage
    function saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    
    // Add a new product
    function addProduct(name, cost, margin) {
        const data = loadData();
        const newProduct = {
            id: Date.now(),
            name: name.trim(),
            cost: parseFloat(cost) || 0,
            margin: parseFloat(margin) || 0,
            sellingPrice: 0,
            createdAt: new Date().toISOString()
        };
        
        // Calculate selling price
        if (newProduct.cost > 0 && newProduct.margin > 0) {
            newProduct.sellingPrice = newProduct.cost * (1 + newProduct.margin / 100);
        }
        
        data.products.push(newProduct);
        saveData(data);
        return newProduct;
    }
    
    // Remove a product
    function removeProduct(id) {
        const data = loadData();
        data.products = data.products.filter(product => product.id !== id);
        saveData(data);
    }
    
    // Update product details
    function updateProduct(id, name, cost, margin) {
        const data = loadData();
        const productIndex = data.products.findIndex(p => p.id === id);
        
        if (productIndex === -1) return;
        
        const updatedProduct = {
            id: id,
            name: name.trim(),
            cost: parseFloat(cost) || 0,
            margin: parseFloat(margin) || 0,
            sellingPrice: 0,
            createdAt: data.products[productIndex].createdAt
        };
        
        // Calculate selling price
        if (updatedProduct.cost > 0 && updatedProduct.margin > 0) {
            updatedProduct.sellingPrice = updatedProduct.cost * (1 + updatedProduct.margin / 100);
        }
        
        data.products[productIndex] = updatedProduct;
        saveData(data);
    }
    
    // Get all products
    function getProducts() {
        return loadData().products;
    }
    
    // Get product by ID
    function getProduct(id) {
        const products = getProducts();
        return products.find(p => p.id === id);
    }
    
    // Calculate total cost
    function calculateTotalCost() {
        const products = getProducts();
        return products.reduce((total, product) => total + product.cost, 0);
    }
    
    // Calculate total profit
    function calculateTotalProfit() {
        const products = getProducts();
        return products.reduce((total, product) => {
            if (product.sellingPrice > 0 && product.cost > 0) {
                return total + (product.sellingPrice - product.cost);
            }
            return total;
        }, 0);
    }
    
    // Get summary statistics
    function getSummary() {
        const products = getProducts();
        const totalCost = calculateTotalCost();
        const totalProfit = calculateTotalProfit();
        const averageMargin = products.length > 0 
            ? products.reduce((sum, p) => sum + p.margin, 0) / products.length 
            : 0;
        
        return {
            totalProducts: products.length,
            totalCost,
            totalProfit,
            averageMargin
        };
    }
    
    // Clear all products
    function clearAll() {
        const data = loadData();
        data.products = [];
        saveData(data);
    }
    
    return {
        addProduct,
        removeProduct,
        updateProduct,
        getProducts,
        getProduct,
        calculateTotalCost,
        calculateTotalProfit,
        getSummary,
        clearAll
    };
})();

// Initialize the calculator when page loads
window.addEventListener('load', function() {
    const calculator = productCostCalculator;
    
    // Load saved data
    const savedData = calculator.getProducts();
    
    // Set up event listeners
    document.getElementById('addProductForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('productName').value;
        const cost = document.getElementById('productCost').value;
        const margin = document.getElementById('productMargin').value;
        
        if (name.trim() && cost && margin) {
            calculator.addProduct(name, cost, margin);
            updateProductList();
            document.getElementById('addProductForm').reset();
        }
    });
    
    // Set up delete buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-product')) {
            const productId = e.target.dataset.productId;
            calculator.removeProduct(productId);
            updateProductList();
        }
    });
    
    // Set up update buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('update-product')) {
            const productId = e.target.dataset.productId;
            const product = calculator.getProduct(productId);
            
            if (product) {
                const name = prompt('Enter new name:', product.name);
                const cost = prompt('Enter new cost:', product.cost);
                const margin = prompt('Enter new margin (%):', product.margin);
                
                if (name && cost && margin) {
                    calculator.updateProduct(productId, name, cost, margin);
                    updateProductList();
                }
            }
        }
    });
    
    // Update the product list display
    function updateProductList() {
        const productList = document.getElementById('productList');
        const products = calculator.getProducts();
        
        if (products.length === 0) {
            productList.innerHTML = '<p class="no-products">No products added yet.</p>';
            return;
        }
        
        let html = '<table class="product-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Cost</th>
                    <th>Margin (%)</th>
                    <th>Selling Price</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>';
        
        products.forEach(product => {
            html += `
            <tr>
                <td>${product.name}</td>
                <td>$${product.cost.toFixed(2)}</td>
                <td>${product.margin}%</td>
                <td>$${product.sellingPrice.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-danger delete-product" data-product-id="${product.id}">Remove</button>
                    <button class="btn btn-sm btn-primary update-product" data-product-id="${product.id}">Edit</button>
                </td>
            </tr>`;
        });
        
        html += '</tbody></table>';
        productList.innerHTML = html;
        
        // Update summary stats
        const summary = calculator.getSummary();
        updateSummaryStats(summary);
    }
    
    // Update summary statistics display
    function updateSummaryStats(summary) {
        const summaryContainer = document.getElementById('summary');
        if (summaryContainer) {
            summaryContainer.innerHTML = `
            <div class="summary-stats">
                <p>Total Products: ${summary.totalProducts}</p>
                <p>Total Cost: $${summary.totalCost.toFixed(2)}</p>
                <p>Total Profit: $${summary.totalProfit.toFixed(2)}</p>
                <p>Average Margin: ${summary.averageMargin.toFixed(2)}%</p>
            </div>`;
        }
    }
    
    // Update product list initially
    updateProductList();
})();