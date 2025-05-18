#include "LRUCache.h"

LRUCache::LRUCache(int cap) : capacity(cap), hits(0), misses(0) {
    // Initialize with dummy head and tail nodes
    head = new Node(-1, -1);
    tail = new Node(-1, -1);
    head->next = tail;
    tail->prev = head;
}

LRUCache::~LRUCache() {
    Node* current = head;
    while (current != nullptr) {
        Node* temp = current;
        current = current->next;
        delete temp;
    }
}

void LRUCache::addToFront(Node* node) {
    node->next = head->next;
    node->prev = head;
    head->next->prev = node;
    head->next = node;
}

void LRUCache::removeNode(Node* node) {
    node->prev->next = node->next;
    node->next->prev = node->prev;
}

int LRUCache::get(int key) {
    if (cache.find(key) == cache.end()) {
        misses++;
        return -1; // Key not found
    }
    
    // Move the accessed node to the front (most recently used)
    hits++;
    Node* node = cache[key];
    removeNode(node);
    addToFront(node);
    
    return node->value;
}

void LRUCache::put(int key, int value) {
    // If key already exists, update value and move to front
    if (cache.find(key) != cache.end()) {
        Node* node = cache[key];
        node->value = value;
        removeNode(node);
        addToFront(node);
        return;
    }
    
    // If cache is full, remove the least recently used item (tail's prev)
    if (cache.size() == capacity) {
        Node* lru = tail->prev;
        removeNode(lru);
        cache.erase(lru->key);
        delete lru;
    }
    
    // Add new node to the front
    Node* newNode = new Node(key, value);
    addToFront(newNode);
    cache[key] = newNode;
}

std::vector<std::pair<int, int>> LRUCache::getCacheState() const {
    std::vector<std::pair<int, int>> result;
    Node* current = head->next;
    
    while (current != tail) {
        result.push_back({current->key, current->value});
        current = current->next;
    }
    
    return result;
}

double LRUCache::getHitRatio() const {
    if (hits + misses == 0) return 0.0;
    return (double)hits / (hits + misses) * 100.0;
}
