from flask import Flask, render_template, request, jsonify
import ctypes
import random
import time
import os

app = Flask(__name__)

# Load the C++ shared library
script_dir = os.path.dirname(os.path.abspath(__file__))
lib_path = os.path.join(script_dir, 'lrucache.so')
lru_lib = ctypes.CDLL(lib_path)

# Define function signatures
lru_lib.createCache.argtypes = [ctypes.c_int]
lru_lib.createCache.restype = ctypes.c_void_p
lru_lib.destroyCache.argtypes = [ctypes.c_void_p]
lru_lib.get.argtypes = [ctypes.c_void_p, ctypes.c_int]
lru_lib.get.restype = ctypes.c_int
lru_lib.put.argtypes = [ctypes.c_void_p, ctypes.c_int, ctypes.c_int]
lru_lib.getHits.argtypes = [ctypes.c_void_p]
lru_lib.getHits.restype = ctypes.c_int
lru_lib.getMisses.argtypes = [ctypes.c_void_p]
lru_lib.getMisses.restype = ctypes.c_int
lru_lib.resetStats.argtypes = [ctypes.c_void_p]
lru_lib.getCacheStateSize.argtypes = [ctypes.c_void_p]
lru_lib.getCacheStateSize.restype = ctypes.c_int
lru_lib.getCacheState.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_int), ctypes.POINTER(ctypes.c_int)]

# Create a global cache object
cache_ptr = None
cache_capacity = 100  # Default capacity

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/create_cache', methods=['POST'])
def create_cache():
    global cache_ptr, cache_capacity
    
    data = request.get_json()
    capacity = data.get('capacity', 100)
    cache_capacity = capacity
    
    # Clean up existing cache if present
    if cache_ptr:
        lru_lib.destroyCache(cache_ptr)
    
    # Create a new cache
    cache_ptr = lru_lib.createCache(capacity)
    return jsonify({'message': f'Cache created with capacity {capacity}', 'capacity': capacity})

@app.route('/api/get', methods=['POST'])
def get():
    global cache_ptr
    
    if not cache_ptr:
        return jsonify({'error': 'Cache not initialized'}), 400
    
    data = request.get_json()
    key = data.get('key')
    
    if key is None:
        return jsonify({'error': 'Key is required'}), 400
    
    # Record time to measure latency
    start_time = time.time()
    value = lru_lib.get(cache_ptr, key)
    latency = (time.time() - start_time) * 1000  # in milliseconds
    
    result = {'key': key, 'found': (value != -1), 'latency_ms': latency}
    if value != -1:
        result['value'] = value
    
    return jsonify(result)

@app.route('/api/put', methods=['POST'])
def put():
    global cache_ptr
    
    if not cache_ptr:
        return jsonify({'error': 'Cache not initialized'}), 400
    
    data = request.get_json()
    key = data.get('key')
    value = data.get('value')
    
    if key is None or value is None:
        return jsonify({'error': 'Key and value are required'}), 400
    
    # Record time to measure latency
    start_time = time.time()
    lru_lib.put(cache_ptr, key, value)
    latency = (time.time() - start_time) * 1000  # in milliseconds
    
    return jsonify({'message': f'Added key {key} with value {value}', 'latency_ms': latency})

@app.route('/api/stats', methods=['GET'])
def get_stats():
    global cache_ptr, cache_capacity
    
    if not cache_ptr:
        return jsonify({'error': 'Cache not initialized'}), 400
    
    hits = lru_lib.getHits(cache_ptr)
    misses = lru_lib.getMisses(cache_ptr)
    total = hits + misses
    hit_ratio = (hits / total * 100) if total > 0 else 0
    
    # Get cache state
    size = lru_lib.getCacheStateSize(cache_ptr)
    keys = (ctypes.c_int * size)()
    values = (ctypes.c_int * size)()
    lru_lib.getCacheState(cache_ptr, keys, values)
    
    cache_items = [{'key': keys[i], 'value': values[i]} for i in range(size)]
    
    return jsonify({
        'hits': hits,
        'misses': misses,
        'total_accesses': total,
        'hit_ratio': hit_ratio,
        'capacity': cache_capacity,
        'current_size': size,
        'cache_items': cache_items
    })

@app.route('/api/reset_stats', methods=['POST'])
def reset_stats():
    global cache_ptr
    
    if not cache_ptr:
        return jsonify({'error': 'Cache not initialized'}), 400
    
    lru_lib.resetStats(cache_ptr)
    return jsonify({'message': 'Statistics reset'})

@app.route('/api/run_simulation', methods=['POST'])
def run_simulation():
    global cache_ptr
    
    if not cache_ptr:
        return jsonify({'error': 'Cache not initialized'}), 400
    
    data = request.get_json()
    num_requests = data.get('num_requests', 1000)
    key_range = data.get('key_range', 200)
    alpha = data.get('alpha', 1.0)  # Zipfian distribution parameter
    
    # Reset stats before simulation
    lru_lib.resetStats(cache_ptr)
    
    # Generate Zipfian distribution (simulating real-world access patterns)
    # For simplicity, we'll approximate using a power law distribution
    keys = []
    for _ in range(num_requests):
        # Power law with parameter alpha
        rank = int(random.random() ** (1.0 / alpha) * key_range) + 1
        keys.append(rank)
    
    # Run simulation
    start_time = time.time()
    hits_over_time = []
    miss_ratio_over_time = []
    
    for i, key in enumerate(keys):
        # Access the key
        value = lru_lib.get(cache_ptr, key)
        
        # If miss, add to cache with key*10 as value
        if value == -1:
            lru_lib.put(cache_ptr, key, key * 10)
        
        # Record statistics at regular intervals
        if (i+1) % (num_requests // 10) == 0 or i == len(keys) - 1:
            hits = lru_lib.getHits(cache_ptr)
            misses = lru_lib.getMisses(cache_ptr)
            hits_over_time.append(hits)
            miss_ratio = misses / (hits + misses) if (hits + misses) > 0 else 0
            miss_ratio_over_time.append(miss_ratio * 100)
    
    total_time = time.time() - start_time
    
    # Get final stats
    hits = lru_lib.getHits(cache_ptr)
    misses = lru_lib.getMisses(cache_ptr)
    hit_ratio = hits / (hits + misses) * 100 if (hits + misses) > 0 else 0
    
    return jsonify({
        'num_requests': num_requests,
        'key_range': key_range,
        'alpha': alpha,
        'total_time_sec': total_time,
        'hits': hits,
        'misses': misses,
        'hit_ratio': hit_ratio,
        'hits_over_time': hits_over_time,
        'miss_ratio_over_time': miss_ratio_over_time
    })

@app.route('/api/analyze_performance', methods=['POST'])
def analyze_performance():
    global cache_ptr
    
    data = request.get_json()
    cache_sizes = data.get('cache_sizes', [10, 50, 100, 200, 500])
    num_requests = data.get('num_requests', 1000)
    key_range = data.get('key_range', 200)
    alpha = data.get('alpha', 1.0)
    
    results = []
    
    # Generate consistent set of requests for fair comparison
    keys = []
    for _ in range(num_requests):
        rank = int(random.random() ** (1.0 / alpha) * key_range) + 1
        keys.append(rank)
    
    for size in cache_sizes:
        # Create cache with current size
        temp_cache = lru_lib.createCache(size)
        
        # Process all requests
        start_time = time.time()
        for key in keys:
            value = lru_lib.get(temp_cache, key)
            if value == -1:
                lru_lib.put(temp_cache, key, key * 10)
        
        total_time = time.time() - start_time
        
        # Get stats
        hits = lru_lib.getHits(temp_cache)
        misses = lru_lib.getMisses(temp_cache)
        hit_ratio = hits / (hits + misses) * 100 if (hits + misses) > 0 else 0
        
        results.append({
            'cache_size': size,
            'hits': hits,
            'misses': misses,
            'hit_ratio': hit_ratio,
            'avg_access_time_ms': (total_time * 1000) / num_requests
        })
        
        # Clean up
        lru_lib.destroyCache(temp_cache)
    
    return jsonify({
        'num_requests': num_requests,
        'key_range': key_range,
        'alpha': alpha,
        'results': results
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
