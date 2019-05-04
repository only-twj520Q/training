$.ajax({
  url: '/info',
  success: function (res) {
    $('#slot').text(res.msg)
  },
  error: function(err) {
    console.error(err)
    $('#slot').text('请求服务器失败')
  }
})
