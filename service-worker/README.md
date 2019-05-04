# Service Worker
## 前言

我们都知道JS是单线程的，也就是说，所有任务只能在一个线程上完成，一次只能做一件事。在现代浏览器中，GUI 渲染线程负责界面的渲染和绘制，它和JS线程属于互斥的关系，就是JS在执行的时候，GUI线程就会停止渲染。为了在进行高耗时 JS 运算时，UI 页面仍可用，同时也为了利用电脑的多核CPU，充分发挥计算机的能力。Web Worker就出现了。可以参考阮一峰老师的[Web Worker 使用教程](http://www.ruanyifeng.com/blog/2018/07/web-worker.html)，这边不再赘述。

Web Worker 有两个特点：

1. 只能服务于新建它的页面，不同页面之间不能共享同一个 Web Worker。
2. 当页面关闭时，该页面新建的 Web Worker 也会随之关闭，不会常驻在浏览器中。



## Service Worker入门

Service Worker是谷歌发起的实现PWA（Progressive Web App）的一个关键角色。它也是Web Worker的一种衍生。下面的文章都简称**SW**。

PWA是为了解决传统Web APP的缺点：

（1）没有桌面入口

（2）无法离线使用

（3）没有Push推送

SW 是一段脚本，与web worker一样，也是在后台运行。作为一个独立的线程，运行环境与普通脚本不同，所以不能直接参与web交互行为。由于SW走的是另外的线程，因此，就算这个线程翻江倒海也不会阻塞主JavaScript线程，也就是不会引起浏览器页面加载的卡顿之类。同时，由于SW设计为完全异步，同步API（如`XHR`和`localStorage`）不能在SW 中使用。在Service Worker里面可以使用fetch等API，它和DOM是隔离的，没有windows/document对象，无法直接操作DOM，无法直接和页面交互，在SW里面无法得知当前页面打开了、当前页面的url是什么，因为一个SW管理当前打开的几个标签页，可以通过clients知道所有页面的url。还有可以通过postMessage的方式和主页面互相传递消息和数据，进而做些控制。还有可以通过postMessage的方式和主页面互相传递消息和数据，进而做些控制。

### 支持情况

除了IE，最新的浏览器都陆续开始支持这个对象。

![image-20190503181832228](/Users/apple/Library/Application Support/typora-user-images/image-20190503181832228.png)

### 使用要求

- 由于SW要求 HTTPS 的环境，我们通常可以借助于 [github page](https://pages.github.com/) 进行学习调试。当然一般浏览器允许调试 Service Worker 的时候 host 为 `localhost` 或者 `127.0.0.1` 也是 ok 的。
- SW的缓存机制是依赖 [Cache API](https://developer.mozilla.org/zh-CN/docs/Web/API/Cache) 实现的
- 依赖 [HTML5 fetch API](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API)
- 依赖 [Promise](https://developer.mozilla.org/zh-CN/docs/Web/javaScript/Reference/Global_Objects/Promise) 实现

### 和web worker区别

1. SW 不是服务于某个特定页面的，而是服务于多个页面的。
2. SW 会**常驻在浏览器中**，即便注册它的页面已经关闭，SW 也不会停止。本质上它是一个后台线程，只有你主动终结，或者浏览器回收，这个线程才会结束。
3. 生命周期、可调用的 API 等等也有很大的不同。

### 能力

SW只是一个常驻在浏览器中的 JS 线程，**它本身做不了什么。它能做什么，全看跟哪些 API 搭配使用**。

1. 跟 Fetch 搭配，可以从浏览器层面拦截请求，做数据 mock；

2. 跟 Fetch 和 CacheStorage 搭配，可以做离线应用；

3. 跟 Push 和 Notification 搭配，可以做像 Native APP 那样的消息推送，这方面可以参考 villainhr 的文章：[Web 推送技术](https://www.villainhr.com/page/2017/01/08/Web 推送技术)

   

## Service Worker使用

基本流程是先注册一个Worker，然后后台就会启动一条线程，可以在这条线程启动的时候去加载一些资源缓存起来，然后监听fetch事件，在这个事件里拦截页面的请求，先看下缓存里有没有，如果有直接返回，否则正常加载。或者是一开始不缓存，每个资源请求后再拷贝一份缓存起来，然后下一次请求的时候缓存里就有了。

* 注册

SW是在`window.navigator`中，我们在页面load事件以后注册，注册的时候传一个js文件给它，这个js文件就是SW的运行环境。

为什么需要在load事件启动呢？因为你要额外启动一个线程，启动之后你可能还会让它去加载资源，这些都是需要占用CPU和带宽的，我们应该保证页面能正常加载完，然后再启动我们的后台线程，不能与正常的页面加载产生竞争，这个在低端移动设备意义比较大。

```javascript
window.addEventListener("load", function() {
  if ('serviceWorker' in navigator) {
    // 注册Service Worker scope表示作用的页面的path
    // register函数返回Promise
    navigator.serviceWorker
      .register('./sw-cache.js', {scope: './'})
      .then(function (reg) {
      console.log('注册成功')
    })
      .catch(function (err) {
      console.log('注册失败')
    })
  }
 })
```

SW和cookie一样有path的概念，这个path就是作用范围。比如，如果你的cookie的path是/page/A，那你不能获取/page/B下的cookie。如果你的cookie的path是根目录/，那你能获取所有目录下的cookie。类似，如果注册的时候使用的js路径为/page/sw.js，那么这个SW只能管理/page路径下的页面和资源，而不能够处理/api路径下的，所以一般把SW注册到顶级目录，这样这个Service Worker就能接管页面的所有资源，监听事件获知所有在你的url根目录里发生的请求。

可以在[chrome://inspect/#service-workers](https://link.juejin.im/?target=chrome%3A%2F%2Finspect%20%2F%23service-workers) 里查看注册的SW。

* install事件

注册完之后，SW就会进行安装，这个时候会触发install事件，在install事件里面可以缓存一些资源。

```javascript
// 监听 service worker 的 install 事件
this.addEventListener('install', function(event) {
  console.log('service worker install');
  caches.open(VERSION)
  let cacheResources = ['./', 'image/test.jpg', 'js/jq.js', 'js/index.js', 'info'];
  event.waitUntil(
    caches.open(VERSION).then(function(cache) {
      return cache.addAll(cacheResources);
    })
  )
});
```

在SW的运行环境里面有一个caches的全局对象，用于管理浏览器缓存。它使我们可以存储网络响应发来的资源，并且根据它们的请求来生成key。这个 API 和浏览器的标准的缓存工作原理很相似，但是是只对应你的站点的域的。它会一直持久存在，直到你告诉它不再存储，你拥有全部的控制权。

我们通过调用 open 来获取一个可操作的具体cache对象。cache.addAll 接收一个url数组，对每一个进行请求，然后将响应结果存到缓存里。它以请求的详细信息为键来缓存每一个值。

`event.waitUntil` 你可以理解为 new Promise，它接受的实际参数只能是一个 promise，因为cache.addAll 返回的都是 Promise，这里就是一个串行的异步加载，当所有加载都成功时，那么 SW 就可以下一步。在 `event.waitUntil()` 内，我们使用了 `caches.open()` 方法来创建了一个新的缓存，将会是我们的站点资源缓存的第一个版本。它返回了一个创建缓存的 promise，当它 resolved 的时候，我们接着会调用在创建的缓存实例（Cache API）上的一个方法 `addAll()`，这个方法的参数是一个由一组相对于 origin 的 URL 组成的数组，这些 URL 就是你想缓存的资源的列表。`event.waitUntil` 只能在 Service Worker 的 install 或者 activate 事件中使用

* fetch

每当网页里产生一个网络请求，都会触发一个fetch事件。触发的时候，你的SW可以拦截请求并决定想要返回什么—是缓存的数据还是一个实际网络请求的结果。

```javascript
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
```

cache.match 会尝试为一个请求寻找匹配的缓存值，如果有直接返回缓存里的response，否则的话正常请求资源并把它放到cache里面。

`event.respondWith` 是一个 FetchEvent 对象里专门用于向浏览器发送响应结果的方法。它接受一个最终能解析成网络响应的 promise。

我们在install的时候进行静态资源缓存，也可以通过fetch事件处理回调来代理页面请求从而实现动态资源缓存。

![](https://ws4.sinaimg.cn/large/006tNc79ly1g2ohbjea2aj30r30g8ab6.jpg)

* **Activate事件**

以前我们用强缓存的时候，如果资源需要更新，那么我们只需要改变资源的 URL，换上新的 MD5 戳就好了。如果使用 Service Worker + CacheStorage + Fetch 做离线应用，又该如何处理资源的更新呢？

1. 当有任何的资源（HTML、JS、Image、甚至是 sw.js 本身）需要更新时，都需要改变 sw.js。因为有了 sw.js，整个应用的入口变成了 sw.js，而非原先的 HTML。每当用户访问页面时，不管你当前是不是命中了缓存，浏览器都会请求 sw.js，然后将新旧 sw.js 进行字节对比，如果不一样，说明需要更新。因此，你能看到在 Demo 中，我们有一个 **VERSION 字段，它不仅代表 sw.js 本身的版本，更代表整个应用的版本**。
2. **不要试图通过改变 sw.js 的名字（如改成 sw_v2.js）来触发浏览器的更新**，因为 HTML 本身会被 sw.js 缓存，而缓存的 HTML 中永远都指向 sw.js，导致浏览器无法得知 sw_v2.js 的更新。
3. 每次 sw.js 的更新，都会根据 VERSION 字段新建一个缓存空间，然后把新的资源缓存在里面。等到旧的 sw.js 所控制的网页全部关闭之后，新的 sw.js 会被激活，然后 在 activate 事件中删除旧缓存空间。这样既能**保证在同时打开多个网页时更新 sw.js 不出差错，也能及时删除冗余的缓存**。



**参考链接**

[Web Worker](https://www.villainhr.com/page/2016/08/22/Web%20Worker](https://www.villainhr.com/page/2016/08/22/Web)

[借助Service Worker和cacheStorage缓存及离线开发](https://www.zhangxinxu.com/wordpress/2017/07/service-worker-cachestorage-offline-develop/)

