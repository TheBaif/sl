<template>
  <view class="login-container">
    <form @submit="handleLogin">
      <view class="login-box">
        <view class="title">用户登录</view>
        <view class="input-group">
          <input 
            name="username"
            type="text" 
            placeholder="请输入用户名"
          />
        </view>
        <view class="input-group">
          <input 
            name="password"
            type="password" 
            placeholder="请输入密码"
          />
        </view>
        <button class="login-btn" form-type="submit">登录</button>
        <view class="register-link">
          还没有账号？<text @tap="goToRegister">立即注册</text>
        </view>
      </view>
    </form>
  </view>
</template>

<script>
import http from '@/utils/request.js'

export default {
  data() {
    return {
      loading: false
    }
  },
  methods: {
    async handleLogin(e) {
      if(this.loading) return
      
      const formData = e.detail.value
      
      if (!formData.username || !formData.password) {
        uni.showToast({
          title: '请输入用户名和密码',
          icon: 'none'
        })
        return
      }
      
      try {
        this.loading = true
        const res = await http.post('/user/login', formData, {
          header: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        
        console.log('登录响应:', res)
        
        if (res.statusCode === 200 && res.data.code === 0) {
          // 直接存储token，不添加Bearer前缀
          const token = res.data.data
          if (!token) {
            throw new Error('登录失败：未获取到token')
          }
          
          // 直接存储原始token
          uni.setStorageSync('token', token)
          console.log('存储的token:', token)
          
          uni.showToast({
            title: '登录成功',
            icon: 'success'
          })
          
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/index/index'
            })
          }, 1500)
        } else {
          throw new Error(res.data.message || '登录失败')
        }
      } catch (error) {
        console.error('登录失败:', error)
        uni.showToast({
          title: error.message || '登录失败，请重试',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    goToRegister() {
      uni.navigateTo({
        url: '/pages/register/register'
      })
    }
  }
}
</script>



<style lang="scss">
.login-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 40rpx;
  
  .login-box {
    background-color: #fff;
    border-radius: 20rpx;
    padding: 40rpx;
    margin-top: 100rpx;
    
    .title {
      font-size: 40rpx;
      font-weight: bold;
      text-align: center;
      margin-bottom: 60rpx;
    }
    
    .input-group {
      margin-bottom: 30rpx;
      
      input {
        width: 100%;
        height: 80rpx;
        background-color: #f5f5f5;
        border-radius: 40rpx;
        padding: 0 30rpx;
        font-size: 28rpx;
      }
    }
    
    .login-btn {
      width: 100%;
      height: 80rpx;
      line-height: 80rpx;
      background-color: #007AFF;
      color: #fff;
      border-radius: 40rpx;
      font-size: 32rpx;
      margin-top: 60rpx;
      
      &::after {
        border: none;
      }
    }
    
    .register-link {
      text-align: center;
      margin-top: 30rpx;
      font-size: 28rpx;
      color: #666;
      
      text {
        color: #007AFF;
        margin-left: 10rpx;
      }
    }
  }
}
</style>
