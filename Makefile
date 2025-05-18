CXX = g++
CXXFLAGS = -std=c++17 -O2 -Wall -fPIC

all: lrucache.so

lrucache.so: src/LRUCache.o src/lrucache_interface.o
	$(CXX) -shared -o $@ $^

src/LRUCache.o: src/LRUCache.cpp src/LRUCache.h
	$(CXX) $(CXXFLAGS) -c $< -o $@

src/lrucache_interface.o: src/lrucache_interface.cpp src/LRUCache.h
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	rm -f src/*.o *.so

.PHONY: all clean
