const config = {
  baseUrl: 'http://localhost:8080'
}

const request = (options = {}) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    console.log('发起请求，当前token:', token)
    
    options.header = {
      'Content-Type': options.header?.['Content-Type'] || 'application/json',
      ...options.header
    }
    
    // 直接使用原始token
    if (token) {
      options.header.Authorization = token
    }
    
    console.log('请求配置:', {
      url: config.baseUrl + options.url,
      method: options.method || 'GET',
      header: options.header,
      data: options.data
    })
    
    uni.request({
      url: config.baseUrl + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: options.header,
      success: (res) => {
        console.log('响应结果:', res)
        
        if (res.statusCode === 200) {
          if (res.data.code === 401) {
            uni.removeStorageSync('token')
            uni.showToast({
              title: '请重新登录',
              icon: 'none'
            })
            setTimeout(() => {
              uni.reLaunch({
                url: '/pages/login/login'
              })
            }, 1500)
            reject(res)
          } else {
            resolve(res)
          }
        } else {
          reject(res)
        }
      },
      fail: (err) => {
        console.error('请求失败:', err)
        reject(err)
      }
    })
  })
}

export default {
  request,
  get(url, options = {}) {
      // 处理GET请求的参数
      if (options.params) {
        const queryString = Object.keys(options.params)
          .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(options.params[key])}`)
          .join('&')
        url = `${url}?${queryString}`
        delete options.params
      }
      
      return request({
        url,
        method: 'GET',
        ...options
      })
    },
  post(url, data, options = {}) {
    return request({
      url,
      method: 'POST',
      data,
      ...options
    })
  }
}
