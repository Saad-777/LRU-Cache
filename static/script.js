document.addEventListener('DOMContentLoaded', function() {
    // Cache reference elements
    const operationResult = document.getElementById('operationResult');
    const cacheVisualization = document.getElementById('cacheVisualization');
    const hitCount = document.getElementById('hitCount');
    const missCount = document.getElementById('missCount');
    const hitRatio = document.getElementById('hitRatio');
    const cacheSize = document.getElementById('cacheSize');
    const hitBar = document.getElementById('hitBar');
    const missBar = document.getElementById('missBar');
    
    // Charts
    let hitsOverTimeChart = null;
    let missRatioChart = null;
    let hitRatioBySizeChart = null;
    let accessTimeBySizeChart = null;
    
    // Event listeners
    document.getElementById('btnCreateCache').addEventListener('click', createCache);
    document.getElementById('btnGet').addEventListener('click', getItem);
    document.getElementById('btnPut').addEventListener('click', putItem);
    document.getElementById('btnResetStats').addEventListener('click', resetStats);
    document.getElementById('btnRunSimulation').addEventListener('click', runSimulation);
    document.getElementById('btnAnalyzePerformance').addEventListener('click', analyzePerformance);
    
    // Create cache
    function createCache() {
        const capacity = parseInt(document.getElementById('cacheCapacity').value);
        
        fetch('/api/create_cache', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ capacity })
        })
        .then(response => response.json())
        .then(data => {
            showAlert('success', `${data.message}`);
            updateStats();
        })
        .catch(error => {
            showAlert('danger', `Error: ${error}`);
        });
    }
    
    // Get item
    function getItem() {
        const key = parseInt(document.getElementById('keyInput').value);
        
        if (isNaN(key)) {
            showAlert('warning', 'Please enter a valid key');
            return;
        }
        
        fetch('/api/get', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ key })
        })
        .then(response => response.json())
        .then(data => {
            if (data.found) {
                showAlert('success', `Found: Key ${key} = ${data.value} (Latency: ${data.latency_ms.toFixed(2)}ms)`);
            } else {
                showAlert('warning', `Cache miss: Key ${key} not found (Latency: ${data.latency_ms.toFixed(2)}ms)`);
            }
            updateStats();
        })
        .catch(error => {
            showAlert('danger', `Error: ${error}`);
        });
    }
    
    // Put item
    function putItem() {
        const key = parseInt(document.getElementById('keyInput').value);
        const value = parseInt(document.getElementById('valueInput').value);
        
        if (isNaN(key) || isNaN(value)) {
            showAlert('warning', 'Please enter valid key and value');
            return;
        }
        
        fetch('/api/put', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ key, value })
        })
        .then(response => response.json())
        .then(data => {
            showAlert('success', `${data.message} (Latency: ${data.latency_ms.toFixed(2)}ms)`);
            updateStats();
        })
        .catch(error => {
            showAlert('danger', `Error: ${error}`);
        });
    }
    
    // Reset stats
    function resetStats() {
        fetch('/api/reset_stats', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            showAlert('success', data.message);
            updateStats();
        })
        .catch(error => {
            showAlert('danger', `Error: ${error}`);
        });
    }
    
    // Run simulation
    function runSimulation() {
        const numRequests = parseInt(document.getElementById('numRequests').value);
        const keyRange = parseInt(document.getElementById('keyRange').value);
        const alpha = parseFloat(document.getElementById('zipfAlpha').value);
        
        document.getElementById('simulationProgress').classList.remove('d-none');
        document.getElementById('simulationResults').classList.add('d-none');
        document.getElementById('btnRunSimulation').disabled = true;
        
        fetch('/api/run_simulation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ num_requests: numRequests, key_range: keyRange, alpha })
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('simulationProgress').classList.add('d-none');
            document.getElementById('simulationResults').classList.remove('d-none');
            document.getElementById('btnRunSimulation').disabled = false;
            
            updateStats();
            displaySimulationResults(data);
            
            showAlert('success', `Simulation completed in ${data.total_time_sec.toFixed(2)} seconds with hit ratio of ${data.hit_ratio.toFixed(2)}%`);
        })
        .catch(error => {
            document.getElementById('simulationProgress').classList.add('d-none');
            document.getElementById('btnRunSimulation').disabled = false;
            showAlert('danger', `Error: ${error}`);
        });
    }
    
    // Analyze performance with different cache sizes
    function analyzePerformance() {
        document.getElementById('analysisProgress').classList.remove('d-none');
        document.getElementById('analysisResults').classList.add('d-none');
        document.getElementById('btnAnalyzePerformance').disabled = true;
        
        fetch('/api/analyze_performance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cache_sizes: [10, 20, 50, 100, 200, 500],
                num_requests: 1000,
                key_range: parseInt(document.getElementById('keyRange').value),
                alpha: parseFloat(document.getElementById('zipfAlpha').value)
            })
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('analysisProgress').classList.add('d-none');
            document.getElementById('analysisResults').classList.remove('d-none');
            document.getElementById('btnAnalyzePerformance').disabled = false;
            
            displayAnalysisResults(data);
            
            showAlert('success', 'Performance analysis complete');
        })
        .catch(error => {
            document.getElementById('analysisProgress').classList.add('d-none');
            document.getElementById('btnAnalyzePerformance').disabled = false;
            showAlert('danger', `Error: ${error}`);
        });
    }
    
    // Update cache stats
    function updateStats() {
        fetch('/api/stats')
        .then(response => response.json())
        .then(data => {
            hitCount.textContent = data.hits;
            missCount.textContent = data.misses;
            hitRatio.textContent = `${data.hit_ratio.toFixed(2)}%`;
            cacheSize.textContent = `${data.current_size}/${data.capacity}`;
            
            const total = data.hits + data.misses;
            if (total > 0) {
                const hitPercentage = (data.hits / total) * 100;
                const missPercentage = (data.misses / total) * 100;
                
                hitBar.style.width = `${hitPercentage}%`;
                missBar.style.width = `${missPercentage}%`;
            } else {
                hitBar.style.width = '0%';
                missBar.style.width = '0%';
            }
            
            // Update cache visualization
            displayCacheVisualization(data.cache_items);
        })
        .catch(error => {
            console.error('Error fetching stats:', error);
        });
    }
    
    // Display cache visualization
    function displayCacheVisualization(items) {
        cacheVisualization.innerHTML = '';
        
        items.forEach((item, index) => {
            const cacheItem = document.createElement('div');
            cacheItem.className = 'cache-item';
            
            // Mark most/least recently used
            if (index === 0) {
                cacheItem.classList.add('mru');
            } else if (index === items.length - 1) {
                cacheItem.classList.add('lru');
            }
            
            // Position indicator
            const position = document.createElement('div');
            position.className = 'position';
            position.textContent = index + 1;
            cacheItem.appendChild(position);
            
            // Key and value
            const keyElement = document.createElement('div');
            keyElement.className = 'key';
            keyElement.innerHTML = `<strong>Key:</strong> ${item.key}`;
            cacheItem.appendChild(keyElement);
            
            const valueElement = document.createElement('div');
            valueElement.className = 'value';
            valueElement.innerHTML = `<strong>Value:</strong> ${item.value}`;
            cacheItem.appendChild(valueElement);
            
            cacheVisualization.appendChild(cacheItem);
        });
        
        if (items.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'text-center w-100 py-3';
            emptyMessage.textContent = 'Cache is empty';
            cacheVisualization.appendChild(emptyMessage);
        }
    }
    
    // Display simulation results
    function displaySimulationResults(data) {
        // Create data points for x-axis (percentage of simulation complete)
        const dataPoints = Array.from({length: data.hits_over_time.length}, (_, i) => 
            `${((i+1) * 10).toFixed(0)}%`);
        
        // Hits over time chart
        const hitsCtx = document.getElementById('hitsOverTimeChart').getContext('2d');
        
        if (hitsOverTimeChart) {
            hitsOverTimeChart.destroy();
        }
        
        hitsOverTimeChart = new Chart(hitsCtx, {
            type: 'line',
            data: {
                labels: dataPoints,
                datasets: [{
                    label: 'Cache Hits',
                    data: data.hits_over_time,
                    borderColor: 'rgba(40, 167, 69, 1)',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Cache Hits Over Time'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Hits'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Simulation Progress'
                        }
                    }
                }
            }
        });
        
        // Miss ratio chart
        const missRatioCtx = document.getElementById('missRatioChart').getContext('2d');
        
        if (missRatioChart) {
            missRatioChart.destroy();
        }
        
        missRatioChart = new Chart(missRatioCtx, {
            type: 'line',
            data: {
                labels: dataPoints,
                datasets: [{
                    label: 'Miss Ratio (%)',
                    data: data.miss_ratio_over_time,
                    borderColor: 'rgba(220, 53, 69, 1)',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Cache Miss Ratio Over Time'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Miss Ratio (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Simulation Progress'
                        }
                    }
                }
            }
        });
    }
    
    // Display performance analysis results
    function displayAnalysisResults(data) {
        const cacheSizes = data.results.map(r => r.cache_size);
        const hitRatios = data.results.map(r => r.hit_ratio);
        const accessTimes = data.results.map(r => r.avg_access_time_ms);
        
        // Hit ratio by cache size chart
        const hitRatioCtx = document.getElementById('hitRatioBySize').getContext('2d');
        
        if (hitRatioBySizeChart) {
            hitRatioBySizeChart.destroy();
        }
        
        hitRatioBySizeChart = new Chart(hitRatioCtx, {
            type: 'line',
            data: {
                labels: cacheSizes,
                datasets: [{
                    label: 'Hit Ratio (%)',
                    data: hitRatios,
                    borderColor: 'rgba(0, 123, 255, 1)',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Hit Ratio by Cache Size'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Hit Ratio (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Cache Size'
                        }
                    }
                }
            }
        });
        
        // Access time by cache size chart
        const accessTimeCtx = document.getElementById('accessTimeBySize').getContext('2d');
        
        if (accessTimeBySizeChart) {
            accessTimeBySizeChart.destroy();
        }
        
        accessTimeBySizeChart = new Chart(accessTimeCtx, {
            type: 'line',
            data: {
                labels: cacheSizes,
                datasets: [{
                    label: 'Avg Access Time (ms)',
                    data: accessTimes,
                    borderColor: 'rgba(255, 193, 7, 1)',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Average Access Time by Cache Size'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Access Time (ms)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Cache Size'
                        }
                    }
                }
            }
        });
    }
    
    // Utility function to show alerts
    function showAlert(type, message) {
        operationResult.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = operationResult.querySelector('.alert');
            if (alert) {
                alert.classList.remove('show');
                setTimeout(() => {
                    operationResult.innerHTML = '';
                }, 150);
            }
        }, 5000);
    }
    
    // Initialize by creating a default cache
    createCache();
});
