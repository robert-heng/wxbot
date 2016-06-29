// var ipc = require('ipc')
var clipboard = require('electron').clipboard
var NativeImage = require('electron').nativeImage
var _ = require('lodash')
// 应对 微信网页偷换了console 使起失效
// 保住console引用 便于使用
window._console = window.console

function debug(/*args*/){
	var args = JSON.stringify(_.toArray(arguments))
	_console.log(args)
}

// 禁止外层网页滚动 影响使用
document.addEventListener('DOMContentLoaded', () => {
	// document.body.style.height = '100%'
	document.body.style.overflow = 'hidden'
})


var free = true
// setTimeout(function(){
	init()
// }, 3000)

function init(){
	var checkForQrcode = setInterval(function(){
		var qrimg = document.querySelector('.qrcode img')
		if (qrimg && qrimg.src.match(/\/qrcode/)) {
			// debug('二维码', qrimg.src)
			clearInterval(checkForQrcode)
		}
	}, 100)
	var checkForLogin = setInterval(function(){
		var chat_item = document.querySelector('.chat_item')
		if (chat_item) {
			onLogin()
			clearInterval(checkForLogin)
		}
	}, 500)
}

function onLogin(){
	// ipc.sendToHost('login')
	$('img[src*=filehelper]').closest('.chat_item')[0].click()
	var checkForReddot = setInterval(function(){
		// window.isFocus = true
		var $reddot = $('.web_wechat_reddot, .web_wechat_reddot_middle').last()
		if ($reddot.length) {
			var $chat_item = $reddot.closest('.chat_item')
			try {
				onReddot($chat_item)
			} catch (err) { // 错误解锁
				reset()
			}
		}
		// var newFriend = $(".chat_item .slide-left .ng-scope")[0];
	}, 100)
}

function onReddot($chat_item){
	if (!free) return
	free = false
	$chat_item[0].click()
	setTimeout(function(){
	var reply = {}
	var usernickname = $(".header .nickname [ng-bind-html='account.NickName']").text();
	// 自动回复 相同的内容
	var $msg = $([
		'.message:not(.me) .bubble_cont > div',
		'.message:not(.me) .bubble_cont > a.app',
		'.message:not(.me) .emoticon',
		'.message_system'
	].join(', ')).last()
	var $message = $msg.closest('.message')
	var $nickname = $message.find('.nickname')
	var $titlename = $('.title_name')
	if ($nickname.length) { // 群聊
		var from = $nickname.text()
		var room = $titlename.text()
	} else { // 单聊
		var from = $titlename.text()
		var room = null
	}
	debug('来自', from, room) // 这里的nickname会被remark覆盖
	if ($msg.is('.plain')) {
		var text = ''
		var normal = false
		var $text = $msg.find('.js_message_plain')
		// $text.contents().each(function(i, node){
		// 	if (node.nodeType === Node.TEXT_NODE) {
		// 		text += node.nodeValue
		// 	} else if (node.nodeType === Node.ELEMENT_NODE) {
		// 		var $el = $(node)
		// 		if ($el.is('br')) text += '\n'
		// 		else if ($el.is('.qqemoji, .emoji')) {
		// 			text += $el.attr('text').replace(/_web$/, '')
		// 		}
		// 	}
		// })
		text = $text.text();
		_console.log($text.text());
		if (text === '[收到了一个表情，请在手机上查看]' ||
				text === '[Received a sticker. View on phone]') { // 微信表情包
			// text = '发毛表情'
			// return false;
		} else if (text === '[收到一条微信转账消息，请在手机上查看]' ||
				text === '[Received transfer. View on phone.]') {
			// text = '转毛帐'
			// return false;
		} else if (text === '[收到一条视频/语音聊天消息，请在手机上查看]' ||
				text === '[Received video/voice chat message. View on phone.]') {
			// text = '聊jj'
			// return false;
		} else if (text === '我发起了实时对讲') {
			// text = '对讲你妹'
			// return false;
		} else if (text === '该类型暂不支持，请在手机上查看') {
			// text = '啥玩意儿'
			// return false;
		} else if (text.match(/(.+)发起了位置共享，请在手机上查看/) ||
				text.match(/(.+)started a real\-time location session\. View on phone/)) {
			// text = '发毛位置共享'
			// return false;
		}else if(text.indexOf("已通过你的好友验证请求，现在可以开始聊天了")>=0){
			text = "what's going on~"
		} else {
			normal = true
		}
		debug('接收', 'text', text)
		
		// if (normal && !text.match(/叼|屌|diao|丢你|碉堡/i)) text = ''
		reply.text = text
	}else{
		debug('接收', 'BUG', $msg);
	}
	debug('回复', reply)
	// if(reply.text.indexOf("http://")>0){

	// }
	// 借用clipboard 实现输入文字 更新ng-model=EditAreaCtn
	// ~~直接设#editArea的innerText无效 暂时找不到其他方法~~
	// _console.log("昵称==========="+$nickname.text())
	// _console.log("titlename==========="+$titlename.text())
	if ($nickname.length) { // 群聊
		if(reply.text.indexOf("@" + usernickname)>=0){
			// paste(reply)
			// requestData(reply.text)
			requestData(reply.text.replace("@"+usernickname,""),$titlename.text())
		}
	}else{
		// paste(reply)
		// requestData(reply.text)
		requestData(reply.text,$titlename.text())
	}
	// 发送text 可以直接更新scope中的变量 @昌爷 提点
	// 但不知为毛 发不了表情
	// if (reply.image) {
	// 	paste(reply)
	// } else {
	// 	angular.element('#editArea').scope().editAreaCtn = reply.text
	// }
	// $('.web_wechat_face')[0].click() 
	// $('[title=阴险]')[0].click() 
	if (reply.image) {
		setTimeout(function(){
			var tryClickBtn = setInterval(function(){
				var $btn = $('.dialog_ft .btn_primary')
				if ($btn.length) {
					$('.dialog_ft .btn_primary')[0].click()
				} else {
					clearInterval(tryClickBtn)
					reset()
				}
			}, 200)
		}, 100)
	} else {
		// $('.btn_send')[0].click()
		// reset()
	}
	}, 100)
}

function reset(){
	// 适当清理历史 缓解dom数量
	var msgs = $('#chatArea').scope().chatContent
	if (msgs.length >= 30) msgs.splice(0, 20)
	$('img[src*=filehelper]').closest('.chat_item')[0].click()
	free = true
}

function paste(opt){
	var oldImage = clipboard.readImage()
	var oldHtml = clipboard.readHtml()
	var oldText = clipboard.readText()
	clipboard.clear() // 必须清空
	if (opt.image) {
		// 不知为啥 linux上 clipboard+nativeimage无效
		try {
			clipboard.writeImage(NativeImage.createFromPath(opt.image))
		} catch (err) {
			opt.image = null
			opt.text = '发不出图片'
		}
	}
	if (opt.html) clipboard.writeHtml(opt.html)
	if (opt.text) clipboard.writeText(opt.text)
	$('#editArea')[0].focus()
	document.execCommand('paste')
	clipboard.writeImage(oldImage)
	clipboard.writeHtml(oldHtml)
	clipboard.writeText(oldText)
}

//添加好友
function addFriends(){
	_console.log("开始自动添加好友。。。。。");
	$(".bubble").filter(".js_message_bubble").filter(".ng-scope").filter(".bubble_default").filter(".left").children(".bubble_cont").children(".card")[0].click();
	$("#mmpop_profile .nickname_area .web_wechat_tab_add").click();
	$("#mmpop_profile .form_area a.button").click();
	setTimeout(function(){
		$(".bubble").filter(".js_message_bubble").filter(".ng-scope").filter(".bubble_default").filter(".left").children(".bubble_cont").children(".card")[0].click();
		$("#mmpop_profile .nickname_area .web_wechat_tab_launch-chat").click();
		var opt ={};
		opt.text = "容我先说句话可好~~";
		paste(opt)
		$('.btn_send')[0].click()
		reset()
	},1000);
}
//request data
function requestData(urlStr,nickname){
	var requestUrl = "http://121.40.34.56/news/baijia/fetchRelate";
	var title = '';
	var url = '';
	var uStr = urlStr;
	var storage = window.localStorage; 
	if(!storage){
		_console.log("不支持storage~~~");
	}
	if(!isNaN(uStr)){
		var lists = JSON.parse(storage.getItem(nickname));
		// var reply = {};
		// _console.log(lists);
		// reply.text = lists[Math.abs(parseInt(urlStr))-1].title;
		// paste(reply)
		// $('.btn_send')[0].click()
		// reset()
		// return "";
		_console.log("++++++++++++++++++"+lists)
		var item = lists[parseInt(uStr)-1];
		uStr = item.title + item.url;
		_console.log("list============="+uStr);
	}
	if(nickname==""){
		_console.log("未找到昵称~~");
		return false;
	}
	var urlIndex = uStr.indexOf("http://")||uStr.indexOf("https://");
	if(urlIndex>=0){
		title = uStr.slice(0,urlIndex);
		url = uStr.slice(urlIndex,uStr.length);
	}
	_console.log("title====="+title)
	_console.log("url====="+url)
	$.ajax({
        type: 'post',
        url: requestUrl,
        dataType: "json",
        // contentType: "multipart/form-data;",
        data: {'title':title,'url':encodeURIComponent(url)},
        jsonp:"callback",
        timeout: 100000,
        crossDomain:true,
        cache: false,
        async: false,
        statusCode: {
	        404:function(data){
	        	_console.log(data);
	        }
	    },
        beforeSend: function(XMLHttpRequest,XMLHttpResponse,text){
            
        },
        success: function(data, textStatus, XMLHttpRequest){
            var reply = {};
            reply.html = '';
        	if(data.msg){
	            reply.html = '暂无相关文章';
        	}else{
	            for(var d in data){
		            reply.html += '【' + (parseInt(d)+1) + '】' + ' ' + data[d].title +"<br>";
		            reply.html += data[d].url + '<br>';
	            }
        	}
			paste(reply)
			$('.btn_send')[0].click()
			reset();
			if(!data.msg){
				storage.setItem(nickname,JSON.stringify(data));
			}
        }
    })
}
