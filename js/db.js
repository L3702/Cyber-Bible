// Cyber Bible - IndexedDB 封装
(function() {
  const DB_NAME = 'CyberBibleDB';
  const DB_VERSION = 1;
  let dbInstance = null;

  // 打开数据库
  function openDB() {
    return new Promise((resolve, reject) => {
      if (dbInstance) {
        resolve(dbInstance);
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function(e) {
        const db = e.target.result;
        // prompts 表
        if (!db.objectStoreNames.contains('prompts')) {
          const promptStore = db.createObjectStore('prompts', { keyPath: 'id' });
          promptStore.createIndex('by_groupId', 'groupId', { unique: false });
          promptStore.createIndex('by_updated', 'updated', { unique: false });
        }
        // groups 表
        if (!db.objectStoreNames.contains('groups')) {
          const groupStore = db.createObjectStore('groups', { keyPath: 'id' });
          groupStore.createIndex('by_name', 'name', { unique: false });
        }
        // annotations 表
        if (!db.objectStoreNames.contains('annotations')) {
          const annoStore = db.createObjectStore('annotations', { keyPath: 'id' });
          annoStore.createIndex('by_promptId', 'promptId', { unique: false });
        }
      };
      request.onsuccess = function(e) {
        dbInstance = e.target.result;
        resolve(dbInstance);
      };
      request.onerror = function(e) {
        reject(e.target.error);
      };
    });
  }

  // 通用：获取所有记录
  function getAll(storeName) {
    return openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = function() { resolve(req.result); };
        req.onerror = function() { reject(req.error); };
      });
    });
  }

  // 通用：获取单条记录
  function get(storeName, id) {
    return openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(id);
        req.onsuccess = function() { resolve(req.result); };
        req.onerror = function() { reject(req.error); };
      });
    });
  }

  // 通用：添加记录
  function add(storeName, data) {
    return openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.add(data);
        req.onsuccess = function() { resolve(data); };
        req.onerror = function() { reject(req.error); };
      });
    });
  }

  // 通用：更新记录
  function update(storeName, data) {
    return openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(data);
        req.onsuccess = function() { resolve(data); };
        req.onerror = function() { reject(req.error); };
      });
    });
  }

  // 通用：删除记录
  function remove(storeName, id) {
    return openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(id);
        req.onsuccess = function() { resolve(id); };
        req.onerror = function() { reject(req.error); };
      });
    });
  }

  // 通用：清空表
  function clear(storeName) {
    return openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.clear();
        req.onsuccess = function() { resolve(); };
        req.onerror = function() { reject(req.error); };
      });
    });
  }

  // 按索引查询
  function getByIndex(storeName, indexName, value) {
    return openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const req = index.getAll(value);
        req.onsuccess = function() { resolve(req.result); };
        req.onerror = function() { reject(req.error); };
      });
    });
  }

  // 导出到全局
  window.CyberBible = window.CyberBible || {};
  window.CyberBible.db = {
    openDB: openDB,
    getAll: getAll,
    get: get,
    add: add,
    update: update,
    delete: remove,
    clear: clear,
    getByIndex: getByIndex
  };
})();
