const { User,Student,File,Article } = require('./models')
const express = require('express')
const jwt = require('jsonwebtoken')
const app = express()
// const SECRET = 'dehabdhabjhrfajfr13uh24yh'
const config = require('./config'); // 引入配置

//var svgCaptcha = require('svg-captcha');
const cookieParase = require('cookie-parser');
app.use(require('cors')())// 处理跨域 ……
app.use(express.json())

app.use(cookieParase());
/*

app.get("/api/getCaptcha",function(req, res, next){
    const KEYS = config.KEYS
    var captcha = svgCaptcha.create({ 
      inverse: false, // 翻转颜色 
      fontSize: 48, // 字体大小 
      noise: 8, // 噪声线条数 
      width: 100, // 宽度 
      height: 40, // 高度 
      size: 4,// 验证码长度
      ignoreChars: '0o1i', // 验证码字符中排除 0o1i
    }); 
    // 保存到session,忽略大小写 
    req.session = captcha.text.toLowerCase(); 
    console.log(req.session); //0xtg 生成的验证码
    //保存到cookie 方便前端调用验证
    res.cookie('captcha', KEYS+req.session); 
    // var aa = require('bcryptjs').hashSync(req.session,10);
    // console.log(aa);
    // res.cookie('captcha', aa); 

    res.setHeader('Content-Type', 'image/svg+xml');
    res.write(String(captcha.data));
    res.end();
})

*/


// 设置为可跨域
// app.all('*', function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "X-Requested-With");
//     res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
//     res.header("X-Powered-By",' 3.2.1')
//     res.header("Content-Type", "*");
//     next();
// });
app.all('*',function(req, res, next) {
    //处理跨域
	res.header("Access-Control-Allow-Origin","*");
	res.header("Access-Control-Allow-Headers","X-Requested-With");
	res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By",' 3.2.1');
	//res.header("Content-Type","*");  /**/
	next();
})

const SECRET = config.SECRET

app.get('/api/users', async (req, res) => {
    const users = await User.find()
    res.send(users)
})

app.post('/api/register', async (req, res) => {
    //    console.log(req.body);

    const users = await User.findOne({
        username: req.body.username,
        // password:req.body.password,
    })
    if (users) {        
    return res.send({
        message: '该用户已存在'
    })}
    const user = await User.create({
        username: req.body.username,
        password: req.body.password,
    })
    res.send({
        user,
        message:'ok'
    })
})

app.post('/api/login', async (req, res) => {
    const user = await User.findOne({
        username: req.body.username,
        // password:req.body.password,
    })
    if (!user) {
        // return res.status(422).send({
        return res.send({
            message: '用户名不存在'
        })
    }
    const isPasswordValid = require('bcryptjs').compareSync(
        req.body.password,
        user.password
    )
    if (!isPasswordValid) {
        // return res.status(422).send({
        return res.send({
            message: '密码错误'
        })
    }
    // return res.status(200).send({
    //     message: 'ok'
    // })
    //生成token

    const token = jwt.sign({
        id: String(user._id),
    }, SECRET)
    res.send({
        user,
        token: token,
        message:'ok'
    })
})

const auth = async (req, res, next) => {
    const raw = String(req.headers.authorization).split(' ').pop()
    // console.log(req.headers.authorization);
    // console.log(raw);
    //const raw = String(req.headers.authorization)
    const { id } = jwt.verify(raw, SECRET)
    req.user = await User.findById(id)
    next()
}

app.get('/api/profile', auth, async (req, res) => {
    res.send(req.user)
})

app.get('/api/orders', auth, async (req, res) => {
    const orders = await Order.find().where({
        user:req.user
    })
    res.send(orders)
})


// plus  echarts

app.get('/api/echarts',auth,async(req,res) =>{
    const grade = await Student.find({$where:function(){return this.webGrade<80}});
    const gradea = await Student.find({$where:function(){return this.dbGrade<80}});
    // const grade = await Student.find({webGrade:{ $lte: 60}});
    //console.log(grade);
    //console.log(gradea);

    let webGrade=[];
    for (let i = 0; i < grade.length; i++) {
        const nb = grade[i].webGrade;
        webGrade.push(nb)
        // console.log(nb);
    }
    // console.log(webGrade);

    let dbGrade=[];
    for (let i = 0; i < gradea.length; i++) {
        const nba = gradea[i].dbGrade;
        dbGrade.push(nba)
        // console.log(nba);
    }
    // console.log(dbGrade);

    const xAxis= dbGrade;
    const series = webGrade;
    const echarts =[xAxis,series]
    res.send(echarts);
})


//显示学生列表：
app.get('/api/getStudentList',auth,async(req,res)=>{
    const students = await Student.find()
    res.send(students)
})
//录入学生：
app.post('/api/students',auth,async(req,res)=>{
    const student = await Student.create(req.body)
    //返回给前端： 
    res.send(student)
})
//删除学生：
app.delete('/api/students/:id',auth,async(req,res)=>{
    await Student.findByIdAndDelete(req.params.id)
    //返回：
    res.send({
        status:true
    })
})
//回显学生详细信息用于修改：
app.get('/api/update/:id',auth,async(req,res)=>{
    const student = await Student.findById(req.params.id)
    res.send(student)
})
//更新学生信息：
app.put('/api/confirmUpdate/:id',auth,async(req,res)=>{
    const student = await Student.findByIdAndUpdate(req.params.id,req.body)
    res.send(student)
})
//根据学号精确查询：
app.get('/api/findBySnumber/:xuehao',auth,async(req,res)=>{
    
    const students = await Student.find({'snumber':req.params.xuehao})
    res.send(students)
})
// //根据姓名模糊查询：
// app.get('/api/findByName/:names',async(req,res)=>{
//     var query = new RegExp(req.params.names)
//     const students = await Student.find({$or:[{"name": query}]})
//     res.send(students)
// })

//根据姓名模糊分页查询:
app.get('/api/findByName',auth, (req,res)=>{

    result= {
        data:{},
        total:''
    };
    // var total;
    var confident = new RegExp(req.query.names)
    //console.log(req.query.names);
    //console.log(confident);
    //总记录数：
    var query =  Student.find({$or:[{"name": confident}]});
    query.count({},function(err, count){
        if(err){
            res.json(err)
        }else{
            result.total = count;
            //console.log("count的值是：",result.total);
        }
    });
    //第几页的数据：
    pageSize = parseInt(req.query.pageSize);
    currentPage = parseInt(req.query.currentPage);

    Student.find({},(error,data)=>{
            result.data = data;
            res.send(result);
    }).where({$or:[{"name": confident}]}).skip((currentPage-1)*pageSize).limit(pageSize);//对结果默认排序

})
//分页查询列表：
app.all('/api/studentList',auth,(req,res,next)=>{

    result= {
        data:[],
        total:''
    };
    // var total;
    //总记录数：
    var query =  Student.find({});
    query.count({},function(err, count){
        if(err){
            res.json(err)
        }else{
            result.total = count;
            //console.log("count的值是：",result);
        }
    });
    //第几页的数据：
    pageSize = parseInt(req.query.pageSize);
    currentPage = parseInt(req.query.currentPage);
    // console.log("页码shishi：");
    //console.log(pageSize+"   "+currentPage);
     Student.find({},(error,data)=>{
         result.data = data;
         res.send(result);
    }).skip((currentPage-1)*pageSize).limit(pageSize);//对结果默认排序

});




//上传文件
app.use('/uploads',express.static(__dirname + '/uploads'));    //无   ;  也行


const multer = require('multer');
const upload = multer({dest: __dirname + '/uploads'});
app.post('/api/upload',upload.single('file'),async(req,res)=>{
    //无   ;  也行？？？
    const file = req.file;  //只有定义了multer 中间件  后才能有req 传回  file ……
    file.url = `http://localhost:3001/uploads/${file.filename}`;
    file.name= `${file.originalname}`
    //await File.create(req.body)
    await File.create(file)
    res.send(file);
})


//加了 auth   jwt  报错？？？
//'/api/upload',auth,upload.single('file'),async(req,res)=>

// JsonWebTokenError: jwt malformed
    // at Object.module.exports [as verify] (D:\VS Code Workspace\Web\student\node_modules\jsonwebtoken\verify.js:63:17)
    // at auth (D:\VS Code Workspace\Web\student\server\server.js:132:24)
    // at Layer.handle [as handle_request] (D:\VS Code Workspace\Web\student\server\node_modules\router\lib\layer.js:102:15)
    // at next (D:\VS Code Workspace\Web\student\server\node_modules\router\lib\route.js:144:13)
    // at Route.dispatch (D:\VS Code Workspace\Web\student\server\node_modules\router\lib\route.js:109:3)
    // at handle (D:\VS Code Workspace\Web\student\server\node_modules\router\index.js:515:11)
    // at Layer.handle [as handle_request] (D:\VS Code Workspace\Web\student\server\node_modules\router\lib\layer.js:102:15)
    // at D:\VS Code Workspace\Web\student\server\node_modules\router\index.js:291:22
    // at Function.process_params (D:\VS Code Workspace\Web\student\server\node_modules\router\index.js:349:12)
    // at next (D:\VS Code Workspace\Web\student\server\node_modules\router\index.js:285:10)
    // at next (D:\VS Code Workspace\Web\student\server\node_modules\router\lib\route.js:138:14)
    // at D:\VS Code Workspace\Web\student\server\server.js:60:2
    // at Layer.handle [as handle_request] (D:\VS Code Workspace\Web\student\server\node_modules\router\lib\layer.js:102:15)
    // at next (D:\VS Code Workspace\Web\student\server\node_modules\router\lib\route.js:144:13)
    // at Route.dispatch (D:\VS Code Workspace\Web\student\server\node_modules\router\lib\route.js:109:3)
    // at handle (D:\VS Code Workspace\Web\student\server\node_modules\router\index.js:515:11)



// '/api/upload',upload.single('file'),auth,async(req,res)=>

// JsonWebTokenError: jwt malformed
    // at Object.module.exports [as verify] (D:\VS Code Workspace\Web\student\node_modules\jsonwebtoken\verify.js:63:17)
    // at auth (D:\VS Code Workspace\Web\student\server\server.js:132:24)
    // at Layer.handle [as handle_request] (D:\VS Code Workspace\Web\student\server\node_modules\router\lib\layer.js:102:15)
    // at next (D:\VS Code Workspace\Web\student\server\node_modules\router\lib\route.js:144:13)
    // at Immediate.<anonymous> (D:\VS Code Workspace\Web\student\server\node_modules\multer\lib\make-middleware.js:53:37)
    // at processImmediate (internal/timers.js:463:21)



//显示文件列表：
app.get('/api/getFileList',auth,async(req,res)=>{
    const files = await File.find()
    res.send(files)
})


//删除文件：
app.delete('/api/files/:id',auth,async(req,res)=>{
    await File.findByIdAndDelete(req.params.id)
    //返回：
    res.send({
        status:true
    })
})



// 查询所有文章
app.get("/api/article", async (req, res) => {
    const articles = await Article.find()
    res.send(articles)
})

// 文章详情
app.get("/api/article/:id", async (req, res) => {
    const article = await Article.findById(req.params.id)
    res.send(article)
})

// 修改文章
app.put("/api/article/:id", async (req, res) => {
    const article = await Article.findByIdAndUpdate(req.params.id, req.body)
    res.send(article)
})

// 新增文章
app.post("/api/article", async (req, res) => {
    const articles = await Article.create(req.body)
    res.send(articles)
})

// 删除文章(接受参数)
app.delete("/api/article/:id", async (req, res) => {
    await Article.findByIdAndDelete(req.params.id)
    res.send({
        status: true
    })
})


app.listen(3001, () => {
    console.log('http://localhost:3001');
})