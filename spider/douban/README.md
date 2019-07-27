## 爬虫初体验

豆瓣top250的电影资料

#### 第三方库
request是对网页进行加载
cheerio是jquery核心功能的一个实现，是用于在服务器端对DOM进行操作的地方。对于爬虫刚好适用。
使用cheerio时我们要手动加载我们的HTML文档
cheerio几乎能够解析任何的HTML

#### 步骤
* 分析目标页面DOM结构，找到所要抓取的信息的相关DOM元素
* 使用request或者superagent等获取页面
* 使用cheerio获取页面元素，将它转化为可操作的节点
* 处理数据
