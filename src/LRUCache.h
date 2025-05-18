#ifndef LRU_CACHE_H
#define LRU_CACHE_H

#include <unordered_map>
#include <iostream>
#include <vector>
#include <utility>

// Node for Doubly Linked List
class Node {
public:
    int key;
    int value;
    Node* prev;
    Node* next;
    
    Node(int k, int v) : key(k), value(v), prev(nullptr), next(nullptr) {}
};

class LRUCache {
private:
    int capacity;
    std::unordered_map<int, Node*> cache; // Hash table
    Node* head; // Most recently used
    Node* tail; // Least recently used
    int hits;   // Cache hits counter
    int misses; // Cache misses counter
    
    // Helper functions
    void addToFront(Node* node);
    void removeNode(Node* node);
    
public:
    LRUCache(int cap);
    ~LRUCache();
    
    int get(int key);
    void put(int key, int value);
    
    // Functions to expose cache state for visualization
    std::vector<std::pair<int, int>> getCacheState() const;
    int getHits() const { return hits; }
    int getMisses() const { return misses; }
    double getHitRatio() const;
    int getSize() const { return cache.size(); }
    int getCapacity() const { return capacity; }
    void resetStats() { hits = 0; misses = 0; }
};

#endif // LRU_CACHE_H
