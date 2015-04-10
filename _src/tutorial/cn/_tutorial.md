<div class="language-toggle">
  Languages / 语言
  <ul>
    <li><a href="/tutorial">English</a></li>
    <li><a href="/tutorial/cn">简体中文</a></li>
  </ul>
</div>
<div id="intro"></div>
# 简介

看完这篇教程后，你就会知道如何给用 `Synth` 创建的默认应用添加功能了。

教程中的示例应用只是一个非常简陋的Twitter，简陋到只具有推文列表的显示功能（但我们会在后面慢慢为它添加功能）。

此教程将会指导你完成：

1. 安装 `Synth`；
2. 创建你的第一个项目。

然后我们将会为这个应用添加以下这些功能：

* 能够发布新推文；
* 能够链接到某条推文单独的页面；
* 能够以非匿名状态发送推文。

<div id="setup"></div>
# 创建

<div id="dependencies"></div>
## 依赖关系

在开始使用 `synth` 之前，你需要安装下面这些库以保证能够正常使用 `synth`：

* Node 版本0.10.0及以上 - [免费获取](http://nodejs.org/)
* NPM 版本1.3及以上（现在它应该会在安装Node的时候一起被安装）
* MongoDB - [免费获取](https://www.mongodb.org/) - 安装完成之后别忘记在后台启动好它

<div id="install"></div>
## 安装 Synth

我们可以通过NPM去获取 `synth` 。将它安装在全局环境中以便我们能通过命令行进行调用：

```bash
npm install -g synth
```

**备注**：当你执行上述代码的时候，如果收到了权限错误之类的提示，你可能需要使用 `sudo npm install -g synth` 来进行安装。

<div id="create-app"></div>
## 创建一个新的应用

```bash
synth new my_app
```

这条命令会把新应用创建到 `my_app` 文件夹中，当然你也可以将它换成任何你喜欢的名字。

```bash
cd my_app # 切换到你新应用的根目录中
synth install -b # 安装第三方的后端库（通过npm）
synth install -f # 安装第三方的前端库（通过bower）
```

然后进入应用文件夹并安装你需要的第三方前端库和后端库*[译注：由于这两个命令分别是基于npm和bower的，所以依赖库的配置文件都会使用它们各自的文件，分别是 `back/package.json` 和 `front/bower.json`]*。

尽管你已经将 `synth` 装在了全局环境中，但为了能够在命令行中使用它，我们还需要在项目中安装它。执行 `synth install -b` 来安装它*[译注：这时候它去查找的其实就是 `back/package.json` 中的依赖关系，在使用 `synth` 生成应用的时候它就默认把自己也给放进这个依赖关系中了]*。

**备注**：

* 后端依赖库将会安装在 `my_app/back/node_modules` 文件夹中。
* 前端依赖库将会安装在 `my_app/front/bower_components` 文件夹中。

<div id="starting"></div>
## 运行这个应用

执行 `synth server` 或者 `synth s` 就可以启动这个应用了。

若要以生产模式（即所有的源文件都被压缩及合并）运行这个应用，需要将 *NODE_ENV* 这个环境变量设置为“production”，然后执行 `synth server` *[译注：在启动服务器命令的前面加上  `NODE_ENV=production` 来将环境变量改变]*，或者直接执行 `synth prod` 命令*[译注：执行这个命令就等同于将环境变量设置为 `production` 之后再执行 `synth server` ]*。

你可以通过 *-p* 传递 *PORT* 参数来设置服务器的监听端口，例如： `synth s -p 3001`。3000 是 `synth` 的默认监听端口。

<div id="populate-db"></div>
## 预配置数据库

当你将浏览器地址指向 [http://localhost:3000/tweets/](http://localhost:3000/tweets/) 的时候，应该能够在页面中间看见“Tweets”这个标题了。但是传说中的 "tweets"（推文） 在哪里呢？

不用担心，`synth` 已经帮你创建了一个能够自动向数据库添加一些推文的脚本。

再打开一个终端窗口，运行这个脚本来生成推文：

```bash
node back/generateTweets.js
```

等它执行完毕后刷新这个应用，应该就能看到20条推文被显示出来了。

<div id="publish"></div>
# 为“tweet”添加功能

现在我们已经能看到推文被显示出来了，但如果访问这个网站的人也能够发送推文的话，是不是就更加美妙了呢。

通过以下三个步骤来实现这个功能：

1. 在后端创建一个接收 *post* 请求的方法；
2. 在前端的 *tweetsController* 中创建一个发布推文的方法；
3. 在前端页面中添加一个 textarea 文本框和一个发布按钮。

<div id="create-post-method"></div>
## 创建接收 *post* 请求的方法

我们需要提供一个 API 接口让这个应用去请求，它的作用是在数据库中创建一条新的推文。

在 `synth` 中添加接口的方法，就是在用来与接口交互的资源文件夹[译注：就是 `back/resource/` 文件夹]中创建一个公共方法。在这个例子中，我们将会在 `back/resources/tweets/` 文件夹里的 *a.js* 中添加一个接收 `post` 请求的方法。

**备注**：*.js* 文件的命名跟 `synth` 的运行没有任何关系，你可以选择任何一个符合你需求的名称。但是在 `back/resources/` 中的文件夹名称和 `synth` 是有关系的，它们决定了 `synth` 监听的路由地址。

在 `my_app/back/resources/tweets/createTweets.js` 这个文件中添加以下代码：

```javascript
exports.post = function (db, params) {
  if (!params.content) throw 422;

  return db.collection('tweets').insert({
    content: params.content.slice(0, 140),
    created_at: new Date()
  });
};
```

#### 说明

你现在在 `/api/tweets` 这个路由上已经有了一个能够响应 **POST** 请求的处理程序。它通过这样的声明 `exports.post = function(db, params)` 来指定请求处理程序依赖于 *db* 和 *params* 服务（都是默认模板的一部分[译注：作者的意思应该是说这中声明方式是默认写法，不用刻意理会]）。`Synth` 将会在请求处理程序被调用的时候自动注入依赖[译注：即将db和params服务作为默认参数传入这个函数]。在执行的过程中，任何参数都会作为请求体的一部分被传入，可以通过 *params* 对象去获取这些参数，另外 *db* 对象将会提供进行数据库连接的组件。

如果请求体中没有附加任何内容，这段程序将会抛出 422 错误，也就是将响应状态码设置为 422 并且返回给客户端。相反，如果响应体中有内容，那么它将会在 mongoDB 中插入一个新的文档[译注：“文档”即推文实例，因为 mongoDB 是文档型数据库，所以这里称之为文档]。

也许你现在想知道：为什么这个函数会把对数据库的调用语句作为返回值呢？因为 `Synth` 内建了对 promise 的支持。意思是说，如果请求成功（即状态码为 200 ），你可以选择直接返回JSON数据，也可以选择返回一个 promise。而在这个应用中，*db* 提供了一个叫做 [promised-mongo](https://github.com/gordonmleigh/promised-mongo) 的库，正如你在 `back/service/db.js` 中所能看到的那样，它被声明在了 *db* 这个服务中。它允许你和 mongoDB 进行交互并且将一个 promise 作为结果返回。如果返回值是一个 promise 的话，`synth` 将会等待这个 promise 被解决（即数据已经被写入到数据库中），然后将一个新的推文以JSON的形式和响应体一起返回给客户端。

如果不使用 `synth` 的 promise 特性及依赖注入，代码需要像下面这样写：

```javascript
exports.post = function (req, res) {
  if (!req.body.content) return res.send(422);

  req.db.collection('tweets').insert({
    content: req.body.content.slice(0, 140),
    created_at: new Date()
  }, function (tweet) {
    res.send( JSON.stringify(tweet) );
  });
};
```

上述代码也能完成同样的功能，但代码行数会更加多一些。有人曾说过，代码越多也就意味着 bug 出现几率越高！

<div id="create-publish-method"></div>
## 在 *tweetsController* 中创建一个发布方法

现在我们已经把后端部分准备好了，如果想要通过发起 http 请求来向数据库添加推文的话，就需要在前端添加创建发送推文请求的 JS 代码。

找到 `my_app/front/controllers/tweets.js` ，在 *tweetsController* 中添加以下代码：

```javascript
$scope.publish = function () {
  $http.post('/api/tweets', { content: $scope.newTweet })
  .success(function (tweet) {
    $scope.tweets.unshift(tweet);
  });
  $scope.newTweet = '';
};
```

你还需要将 *$http* 服务注入给这个控制器（在代码的第 2 行）：

```javascript
.controller('tweetsController', function ($scope, $http, data) {
```

#### 说明

如果你很熟悉 AngularJS，将会非常容易理解上述代码。它向 `http://localhost:3000/api/tweets` 这个地址发起了一个 POST 请求，并携带了一串 JSON 数据（例如： `{"content": "An example tweet"}`）。

和 `synth` 一样，AngularJS 也内建了对 promise 的支持。这个 post 请求就是一个 promise，一旦它成功地被解决，就会添加一条推文到列表中并呈现给用户[译注：即 post 请求成功的话就会调用 success 回调函数去添加推文]。

为了防止意外发送两条一模一样的推文，这段代码还会在 http 请求完成之前将 *newtweet* 这个变量清空。

<div id="add-textarea-and-button"></div>
## 添加 textarea 和 button 表单控件

现在我们已经完成了发布推文的前后端代码，但还剩下让用户能够输入他们的推文并且触发 *publish* 方法的 UI 及交互部分。

找到用来显示推文列表的视图模板，它位于 `my_app/front/html/tweets/getIndex.jade`。

打开这个文件并将以下代码添加到最顶部：

```jade
textarea(ng-model="newTweet")
button(ng-click="publish()", ng-disabled="newTweet.length == 0") Publish
```

#### 说明

也许你对 [jade](http://jade-lang.com/) 并不熟悉，可一旦掌握了它的窍门，将能以更好的方式去编写 HTML。

上述 jade 代码添加了一个 textarea 文本框，并将它关联到了 *newTweet* 这个 Angular 数据模型上。接着它添加了一个 button 按钮并绑定了 click 事件，当点击这个按钮的时候就会去触发控制器中的 *publish* 方法。

进行到到这里，你已经能够发布一条新的推文了！

<div id="enable-links-to-tweets"></div>
# 为每条推文创建单独的链接

看到一条条推文被列出来真是太棒了，但如果你发现了一条很好的推文，想要把它的链接分享出去怎么办呢？

通过以下三个步骤来实现这个功能：

1. 在后端创建一个接收 *get* 请求的方法；
2. 在前端创建一个新的 *tweetController* 控制器（注意这个 "tweet" 是单数而不是复数）；
3. 为新的视图创建一个 html 模板。

<div id="create-get-method"></div>
## 创建接收 *GET* 请求的方法

在 `back/resources/tweets/getTweets.js` 中已经有一个用于获取推文列表的 API 了。

继续创建一个获取单条推文的 API 接口，声明 `get` 方法并将它 exports 出去。

```javascript
exports.get = function (params, db) {
  // 返回一个获取请求推文的 promise
  return db.collection('tweets').findOne({
    _id: db.ObjectId(params.id)
  });
}
```

#### 说明

当这个处理 `get` 请求的函数被创建完成的时候，API 接口也就创建完成了，请求这个接口时需要传入一个推文 ID 作为参数。

上述代码将会监听客户端对 `/api/tweets/:id` 的请求。

`Params` 服务会将请求的 URL 转换并将传入的推文 id 提供给我们使用。

请注意 `db.ObjectId` 只是一个用来将字符串转换为数据库特殊类型的方法。这个方法适用于 mongoDB。

<div id="create-tweet-controller"></div>
## 创建一个新的 *tweetController* 控制器

首页我们需要向你的 Angular 路由中添加一个新的路由配置。

在 `front/js/front-app.js` 中使用 `$routeProvider` 服务添加另外一个 `.when` 配置：

```javascript
…
$routeProvider
.when('/tweets', {
  templateUrl: '/html/tweets/getIndex.html',
  controller: 'tweetsController',
  resolve: {
    data: dataLoaderRunner
  }
})
.when('/tweets/:id', {
  templateUrl: '/html/tweets/get.html',
  controller: 'tweetController',
  resolve: {
    data: dataLoaderRunner
  }
})
…
```

这样一来，当匹配到这个 URL 的时候，你的 AngularJS 应用就会去调用 `tweetController` 这个控制器。

现在你应该在 Angular 应用中添加这个控制器。

`front/js/controllers/tweets.js`:

```javascript
.controller('tweetsController', function ($scope, data) {
  $scope.tweets = data.tweets;
})
.controller('tweetController', function ($scope, data) {
  angular.extend($scope, data);
});
```

上述代码会将从 API 获得的数据拷贝到作用域中，这样一来，我们就能够在下一步的视图中去渲染它们了。

<div id="create-tweet-view"></div>
## 创建 *tweet* 视图并且添加超链接

创建一个新 html 文件作为视图：

`front/html/tweets/get.html`

```html
<div class="tweet">
  <div class="content">
    {{ content }}
  </div>
  <div class="date">
    {{ created_at | date:'medium' }}
  </div>
</div>
```

然后在 index 视图模板中给推文添加超链接：

`front/html/tweets/getIndex.jade`

```javascript
ul.tweet-timeline
  li.tweet(ng-repeat="tweet in tweets")
    .content {{ tweet.content}}
    a(href="/tweets/{{ tweet._id }}")
      .date {{ tweet.created_at | date:'medium' }}
```

就这样，现在你已经有了一个专属推文页了！

# 添加用户认证功能

敬请期待……
