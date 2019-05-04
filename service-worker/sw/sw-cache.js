const VERSION = 'v1';

// 监听 service worker 的 install 事件
this.addEventListener('install', event => {
  console.log('service worker install');
  this.skipWaiting();
  // 如果监听到了 service worker 已经安装成功的话，就会调用 event.waitUntil 回调函数
  event.waitUntil(
    caches.open(VERSION).then(cache => {
      // 通过 cache 缓存对象的 addAll 方法添加 precache 缓存
      let cacheResources = ['image/test.jpg', 'js/jq.js', 'js/index.js', 'info'];
      return cache.addAll(cacheResources);
    })
  )
});

// 监听 service worker 的 fetch 事件
this.addEventListener('fetch', event => {
  console.log('service worker fetch');
  const { request } = event;
  event.respondWith(
    caches.match(request).then(response => {
      // 直接返回，减少http请求
      if (response) {
        console.log('response')
        return response;
      }
      // request流已经在cache.match中使用过一次，不能再次使用，只能得到它的副本
      let fetchRequest = request.clone();
      console.log('fetch')
      return fetch(fetchRequest).then(response => {
        // 检查是否成功
        if(!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        // 如果成功，该 response 一是要拿给浏览器渲染，而是要进行缓存
        // 不过需要记住，由于 caches.put 使用的是文件的响应流，一旦使用，那么返回的 response 就无法访问造成失败，所以，这里需要复制一份
        let responseClone = response.clone();
        caches.open(VERSION).then(cache => {
          cache.put(request, responseClone);
        })
        return response;
      })
    })
  )
})

//  监听 service worker 的 activate 事件
this.addEventListener('activate', event => {
  console.log('service worker activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // 如果当前版本和缓存版本不一致
          if (cacheName !== VERSION) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
