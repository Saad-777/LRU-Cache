#include "LRUCache.h"
#include <vector>

extern "C" {
    // Create and destroy cache
    void* createCache(int capacity) {
        return new LRUCache(capacity);
    }
    
    void destroyCache(void* cache_ptr) {
        delete static_cast<LRUCache*>(cache_ptr);
    }
    
    // Basic operations
    int get(void* cache_ptr, int key) {
        return static_cast<LRUCache*>(cache_ptr)->get(key);
    }
    
    void put(void* cache_ptr, int key, int value) {
        static_cast<LRUCache*>(cache_ptr)->put(key, value);
    }
    
    // Stats
    int getHits(void* cache_ptr) {
        return static_cast<LRUCache*>(cache_ptr)->getHits();
    }
    
    int getMisses(void* cache_ptr) {
        return static_cast<LRUCache*>(cache_ptr)->getMisses();
    }
    
    void resetStats(void* cache_ptr) {
        static_cast<LRUCache*>(cache_ptr)->resetStats();
    }
    
    // Cache state
    int getCacheStateSize(void* cache_ptr) {
        return static_cast<LRUCache*>(cache_ptr)->getSize();
    }
    
    void getCacheState(void* cache_ptr, int* keys, int* values) {
        auto cache = static_cast<LRUCache*>(cache_ptr);
        auto state = cache->getCacheState();
        
        for (size_t i = 0; i < state.size(); i++) {
            keys[i] = state[i].first;
            values[i] = state[i].second;
        }
    }
}
