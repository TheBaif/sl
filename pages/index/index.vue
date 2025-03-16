<template>
  <view 
    class="home_container"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <view class="home_top">
      <image class="avatar" :src="userInfo.userPic || '/static/avatar.png'" @tap="navigateToUserProfile"></image>
    </view>
    <view class="back_container">
      <image
        class="center-image" 
        src="/static/home_back.png"
        mode="aspectFit"
      ></image>
    </view>
    <view class="navigation1">
      <!-- 为学习按钮添加跳转功能 -->
      <button class="left_nav1_btn" @tap="navigateToVocabulary">学习</button>
      <button class="right_nav1_btn" @tap="navigateToPractice">练习</button>
    </view>
  </view>
</template>

<script>
import http from '@/utils/request.js'

export default {
  data() {
    return {
      touchStartY: 0,
      swipeThreshold: 100,
      minVerticalSwipe: 30,
      userInfo: {}
    }
  },
  
  onLoad() {
    this.checkLogin()
    this.getUserInfo()
  },
  
  onShow() {
    this.checkLogin()
    this.getUserInfo()
  },
  
  methods: {
    // 添加跳转到手语词库的方法
    navigateToVocabulary() {
      uni.navigateTo({
        url: '/pages/vocabulary/index/index'
      })
    },
    
    checkLogin() {
      const token = uni.getStorageSync('token')
      console.log('当前token:', token)
      if (!token) {
        uni.reLaunch({
          url: '/pages/login/login'
        })
      }
    },
    
    async getUserInfo() {
      try {
        const token = uni.getStorageSync('token')
        if (!token) return
        
        const res = await http.get('/userInfo')
        if (res.data.code === 0) {
          this.userInfo = res.data.data
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    },
    
    navigateToUserProfile() {
      uni.navigateTo({
        url: '/pages/user/user'
      })
    },
    
    handleAvatar() {
      uni.showActionSheet({
        itemList: ['退出登录'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.handleLogout()
          }
        }
      })
    },
    
    handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            uni.removeStorageSync('token')
            uni.removeStorageSync('userInfo')
            uni.reLaunch({
              url: '/pages/login/login'
            })
          }
        }
      })
    },
    
    handleTouchStart(e) {
      this.touchStartY = e.touches[0].clientY
    },
    
    handleTouchEnd(e) {
      const touchEndY = e.changedTouches[0].clientY
      const deltaY = touchEndY - this.touchStartY
      
      if (deltaY > this.minVerticalSwipe && 
          Math.abs(deltaY) > this.swipeThreshold) {
        this.navigateToSearch()
      }
    },
    
    navigateToSearch() {
      const token = uni.getStorageSync('token')
      if (!token) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        })
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/login/login'
          })
        }, 1500)
        return
      }
      
      uni.navigateTo({
        url: '/pages/search/search'
      })
    },
	navigateToPractice() {
  uni.navigateTo({
    url: '/pages/practice/practice'
  });
}
  }
}
</script>

<style lang="scss">
.home_container {
  width: 100%;
  height: 1200rpx;
  background: rgba(60, 137, 153, 1);

  .home_top {
    width: 100%;
    height: 200rpx;
    position: relative;
    background: rgba(60, 137, 153, 1);
    justify-content: center;
    align-items: center;

    .avatar {
      width: 100rpx;
      height: 100rpx;
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      border-radius: 50%;
      margin-right: 30rpx;
      border: 2rpx solid #fff;
    }
  }

  .navigation1 {
    display: flex;
    background: rgba(60, 137, 153, 1);
    height: 100rpx;
    align-items: center;
    justify-content: space-between;
    margin-top: 50rpx;

    .left_nav1_btn,
    .right_nav1_btn {
      background-color: rgba(60, 137, 153, 1);
      width: 200rpx;
      height: 100%;
      padding: 0;
      white-space: nowrap;
      color: white;
      font-size: 50rpx;
      font-family: 'Times New Roman', Times, serif;
      text-align: center;
      line-height: 100rpx;
    }

    .left_nav1_btn {
      margin-left: 120rpx;
    }

    .right_nav1_btn {
      margin-right: 120rpx;
    }
  }

  .back_container {
    display: flex;
    justify-content: center;
    height: 600rpx;
    background: rgba(60, 137, 153, 1);

    .center-image {
      width: 120%;
      height: 120%;
    }
  }
}
</style>
