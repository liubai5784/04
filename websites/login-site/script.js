
const API = "/api";

// ================= 注册 =================
async function register(){

  function togglePwd(){

  const input = document.getElementById("p");
  const btn = document.getElementById("eyeBtn");

  if(input.type === "password"){
    input.type = "text";
    btn.innerText = "隐藏";
  }else{
    input.type = "password";
    btn.innerText = "显示";
  }
}
  
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();

  if(!user || !pass){
    document.getElementById("msg").innerText = "用户名或密码不能为空";
    return;
  }

  const res = await fetch(API + "/register", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({user, pass})
  });

  const data = await res.json();

  if(data.ok){
    document.getElementById("msg").innerText = "注册成功，可以登录";
  }else{
    document.getElementById("msg").innerText = data.msg || "注册失败";
  }
}


// ================= 登录 =================
async function login(){

  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();

  const res = await fetch(API + "/login", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({user, pass})
  });

  const data = await res.json();

  if(!data.ok){
    document.getElementById("msg").innerText = "登录失败";
    return;
  }

  // 保存登录状态
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", data.user);

  route(data.user);
}


// ================= 路由 =================
function route(user){

  document.getElementById("authBox").classList.add("hidden");

  // admin进入后台页面
  if(user === "admin"){
    location.href = "admin.html";
    return;
  }

  // 普通用户
  document.getElementById("userPage").classList.remove("hidden");

  document.getElementById("name").innerText = user;

  document.getElementById("avatar").src =
    "https://api.dicebear.com/7.x/identicon/svg?seed=" + user;
}


// ================= 上传头像 =================
async function uploadAvatar(){

  const file = document.getElementById("avatarFile").files[0];
  if(!file){
    alert("请选择图片");
    return;
  }

  const reader = new FileReader();

  reader.onload = async () => {

    const base64 = reader.result;

    const res = await fetch(API + "/avatar", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        token: localStorage.getItem("token"),
        avatar: base64
      })
    });

    const data = await res.json();

    if(data.ok){
      document.getElementById("avatar").src = base64;
      alert("头像更新成功");
    }else{
      alert("上传失败");
    }
  };

  reader.readAsDataURL(file);
}


// ================= 保存简介 =================
async function saveBio(){

  const bio = document.getElementById("bio").value;

  const res = await fetch(API + "/bio", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      token: localStorage.getItem("token"),
      bio
    })
  });

  const data = await res.json();

  alert(data.ok ? "保存成功" : "保存失败");
}


// ================= 留言 =================
async function saveMsg(){

  const msg = document.getElementById("msgToAuthor").value;

  const res = await fetch(API + "/msg", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      token: localStorage.getItem("token"),
      msg
    })
  });

  const data = await res.json();

  alert(data.ok ? "提交成功" : "提交失败");
}


// ================= 退出 =================
function logout(){
  localStorage.clear();
  location.href = "index.html";
}


// ================= 自动登录 =================
window.onload = async () => {

  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if(!token || !user){
    return;
  }

  const res = await fetch(API + "/me", {
    headers:{
      Authorization: token
    }
  });

  const data = await res.json();

  if(!data.ok){
    localStorage.clear();
    return;
  }

  route(user);
};