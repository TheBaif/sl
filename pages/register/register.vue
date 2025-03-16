<template>
  <view class="register-container">
    <form @submit="handleRegister">
      <view class="register-box">
        <view class="title">用户注册</view>
        
        <view class="input-group">
          <input 
            name="username"
            type="text" 
            placeholder="请输入用户名 (5-16位)"
            v-model="formData.username"
            @input="validateUsername"
          />
          <view class="error-tip" v-if="errors.username">{{ errors.username }}</view>
        </view>
        
        <view class="input-group">
          <input 
            name="password"
            type="password" 
            placeholder="请输入密码 (5-16位)"
            v-model="formData.password"
            @input="validatePassword"
          />
          <view class="error-tip" v-if="errors.password">{{ errors.password }}</view>
        </view>
        
        <button class="register-btn" form-type="submit" :disabled="!isFormValid">注册</button>
        <view class="login-link">
          已有账号？<text @click="goToLogin">立即登录</text>
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
      loading: false,
      formData: {
        username: '',
        password: ''
      },
      errors: {
        username: '',
        password: ''
      }
    }
  },
  computed: {
    isFormValid() {
      return this.formData.username.length >= 5 && 
             this.formData.username.length <= 16 &&
             this.formData.password.length >= 5 &&
             this.formData.password.length <= 16 &&
             !this.errors.username &&
             !this.errors.password;
    }
  },
  methods: {
    validateUsername() {
      const usernamePattern = /^\S{5,16}$/;
      if (!this.formData.username) {
        this.errors.username = '用户名不能为空';
      } else if (!usernamePattern.test(this.formData.username)) {
        this.errors.username = '用户名应为5-16位非空白字符';
      } else {
        this.errors.username = '';
      }
    },
    
    validatePassword() {
      const passwordPattern = /^\S{5,16}$/;
      if (!this.formData.password) {
        this.errors.password = '密码不能为空';
      } else if (!passwordPattern.test(this.formData.password)) {
        this.errors.password = '密码应为5-16位非空白字符';
      } else {
        this.errors.password = '';
      }
    },
    
    async handleRegister(e) {
      if (this.loading || !this.isFormValid) return;
      
      try {
        this.loading = true;
        
        const requestData = {
          username: this.formData.username,
          password: this.formData.password
        };
        
        console.log('注册请求参数:', requestData);
        
        const res = await http.post('/user/register', requestData, {
          header: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        console.log('注册响应:', res);
        
        if (res.statusCode === 200 && res.data.code === 0) {
          uni.showToast({
            title: '注册成功',
            icon: 'success'
          });
          
          setTimeout(() => {
            uni.navigateTo({
              url: '/pages/login/login'
            });
          }, 1500);
        } else {
          throw new Error(res.data.msg || '注册失败');
        }
      } catch (error) {
        console.error('注册失败:', error);
        uni.showToast({
          title: error.message || '注册失败，请重试',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    goToLogin() {
      uni.navigateTo({
        url: '/pages/login/login'
      });
    }
  }
}
</script>

<style lang="scss">
.register-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 40rpx;
  
  .register-box {
    background-color: #fff;
    border-radius: 20rpx;
    padding: 40rpx;
    margin-top: 60rpx;
    
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
      
      .error-tip {
        font-size: 24rpx;
        color: #ff4d4f;
        padding: 10rpx 30rpx 0;
      }
    }
    
    .register-btn {
      width: 100%;
      height: 80rpx;
      line-height: 80rpx;
      background-color: #007AFF;
      color: #fff;
      border-radius: 40rpx;
      font-size: 32rpx;
      margin-top: 40rpx;
      
      &::after {
        border: none;
      }
      
      &[disabled] {
        background-color: #ccc;
        color: #fff;
      }
    }
    
    .login-link {
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

