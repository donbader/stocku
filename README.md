# Stocku



## 安裝:
```
$ git clone https://github.com/0xYTF/stocku
$ cd stocku
$ npm install
```

## 使用:
```
$ npm start
$ npm stop
```

or
```
$ node bin/www
```

預設的port為 8000
若要更改，請使用
```
$ PORT=???? npm start
```


## 結構:
`/database`： 存放股票資料  
`/public`：放前端的js、css、3rdparty  
`app.js`：server主程式，由`/bin/www`呼叫  
`package.json`：npm的config  
