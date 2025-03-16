<template>
  <view class="home-container">
    <!-- Top Navigation Bar -->
    <view class="top-bar">
      <view class="user-profile" @tap="navigateToUserProfile">
        <image class="avatar" :src="userInfo.userPic || '/static/avatar.png'"></image>
        <text class="username">{{ userInfo.nickname || userInfo.username || '欢迎使用' }}</text>
      </view>
      <view class="search-icon" @tap="navigateToSearch">
        <text class="iconfont">&#xe61c;</text>
      </view>
    </view>

    <!-- Main Content Area -->
    <view class="main-content">
      <view class="welcome-card">
        <view class="welcome-text">
          <text class="greeting">您好，</text>
          <text class="message">今天想学习什么？</text>
        </view>
        <image src="/static/welcome-illustration.png" mode="aspectFit" class="welcome-image"></image>
      </view>
      
      <view class="feature-cards">
        <view class="feature-card" @tap="navigateToVocabulary">
          <view class="card-icon vocabulary-icon">
            <text class="iconfont">&#xe65b;</text>
          </view>
          <view class="card-content">
            <text class="card-title">手语词库</text>
            <text class="card-desc">探索丰富的手语词汇</text>
          </view>
          <text class="card-arrow">›</text>
        </view>
        
        <view class="feature-card" @tap="navigateToPractice">
          <view class="card-icon practice-icon">
            <text class="iconfont">&#xe665;</text>
          </view>
          <view class="card-content">
            <text class="card-title">手语练习</text>
            <text class="card-desc">提升手语表达能力</text>
          </view>
          <text class="card-arrow">›</text>
        </view>
      </view>
      
      <!-- Daily Progress Card -->
      <view class="progress-card" @tap="navigateToProgress">
        <view class="progress-header">
          <text class="progress-title">学习进度</text>
          <text class="view-all">查看详情</text>
        </view>
        
        <view class="progress-stats">
          <view class="stat-item">
            <text class="stat-value">{{ learningStats.todayMinutes || 0 }}</text>
            <text class="stat-label">今日学习(分钟)</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ learningStats.streak || 0 }}</text>
            <text class="stat-label">连续学习(天)</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ learningStats.mastered || 0 }}</text>
            <text class="stat-label">已掌握(个)</text>
          </view>
        </view>
      </view>
      
      <!-- Recommendations -->
      <view class="recommendation-section">
        <view class="section-header">
          <text class="section-title">推荐学习</text>
          <text class="view-all" @tap="navigateToRecommendation">查看全部</text>
        </view>
        
        <scroll-view scroll-x class="recommendation-scrollview">
          <view 
            class="recommendation-item" 
            v-for="(item, index) in recommendedSigns.slice(0, 5)" 
            :key="index"
            @tap="viewSignDetail(item)"
          >
            <image 
              :src="item.imageSrc || '/static/placeholder-sign.png'" 
              class="recommendation-image"
              mode="aspectFill"
            ></image>
            <text class="recommendation-name">{{ item.name }}</text>
          </view>
        </scroll-view>
      </view>
    </view>
    
    <!-- Bottom Navigation -->
    <view class="bottom-nav">
      <view class="nav-item active">
        <text class="iconfont">&#xe65e;</text>
        <text class="nav-text">首页</text>
      </view>
      
      <view class="nav-item" @tap="navigateToVocabulary">
        <text class="iconfont">&#xe65b;</text>
        <text class="nav-text">词库</text>
      </view>
      
      <view class="nav-item" @tap="navigateToPractice">
        <text class="iconfont">&#xe665;</text>
        <text class="nav-text">练习</text>
      </view>
      
      <view class="nav-item" @tap="navigateToUserProfile">
        <text class="iconfont">&#xe6a4;</text>
        <text class="nav-text">我的</text>
      </view>
    </view>
  </view>
</template>

<script>
import http from '@/utils/request.js'

export default {
  data() {
    return {
      userInfo: {},
      learningStats: {
        todayMinutes: 0,
        streak: 0,
        mastered: 0
      },
      recommendedSigns: []
    }
  },
  
  onLoad() {
    this.checkLogin()
  },
  
  onShow() {
    this.checkLogin()
    this.getUserInfo()
    this.getRecommendations()
  },
  
  methods: {
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
        
        const res = await http.get('/user/userInfo')
        if (res.data.code === 0) {
          this.userInfo = res.data.data
          
          // Mock learning stats for display
          this.learningStats = {
            todayMinutes: Math.floor(Math.random() * 60),
            streak: Math.floor(Math.random() * 10),
            mastered: Math.floor(Math.random() * 50)
          }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    },
    
    async getRecommendations() {
      try {
        const res = await http.get('/learning/recommendations', {
          params: { limit: 10 }
        })
        
        if (res.data && res.data.code === 0 && res.data.data) {
          this.recommendedSigns = res.data.data
        } else {
          // Fallback to mock data if API fails
          this.recommendedSigns = [
            { id: 1, name: '你好', imageSrc: '/static/signs/hello.png' },
            { id: 2, name: '谢谢', imageSrc: '/static/signs/thanks.png' },
            { id: 3, name: '再见', imageSrc: '/static/signs/goodbye.png' },
            { id: 4, name: '朋友', imageSrc: '/static/signs/friend.png' },
            { id: 5, name: '家人', imageSrc: '/static/signs/family.png' }
          ]
        }
      } catch (error) {
        console.error('获取推荐失败:', error)
        // Set mock data on error
        this.recommendedSigns = [
          { id: 1, name: '你好', imageSrc: '/static/signs/hello.png' },
          { id: 2, name: '谢谢', imageSrc: '/static/signs/thanks.png' },
          { id: 3, name: '再见', imageSrc: '/static/signs/goodbye.png' },
          { id: 4, name: '朋友', imageSrc: '/static/signs/friend.png' },
          { id: 5, name: '家人', imageSrc: '/static/signs/family.png' }
        ]
      }
    },
    
    navigateToVocabulary() {
      uni.navigateTo({
        url: '/pages/vocabulary/index/index'
      })
    },
    
    navigateToPractice() {
      uni.navigateTo({
        url: '/pages/practice/practice'
      })
    },
    
    navigateToUserProfile() {
      uni.navigateTo({
        url: '/pages/user/user'
      })
    },
    
    navigateToSearch() {
      uni.navigateTo({
        url: '/pages/search/search'
      })
    },
    
    navigateToProgress() {
      uni.navigateTo({
        url: '/pages/progress-dashboard/progress-dashboard'
      })
    },
    
    navigateToRecommendation() {
      uni.navigateTo({
        url: '/pages/recommendation/recommendation'
      })
    },
    
    viewSignDetail(item) {
      const results = [item]
      uni.setStorageSync('searchResults', results)
      uni.navigateTo({
        url: `/pages/detail/detail?index=0`
      })
    }
  }
}
</script>

<style lang="scss">
.home-container {
  min-height: 100vh;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
  
  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx;
    background-color: #ffffff;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
    
    .user-profile {
      display: flex;
      align-items: center;
      
      .avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 40rpx;
        margin-right: 20rpx;
        border: 2rpx solid #f0f0f0;
      }
      
      .username {
        font-size: 30rpx;
        color: #333;
        font-weight: 500;
      }
    }
    
    .search-icon {
      width: 80rpx;
      height: 80rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f5f5;
      border-radius: 40rpx;
      
      .iconfont {
        font-size: 40rpx;
        color: #3C8999;
      }
    }
  }
  
  .main-content {
    flex: 1;
    padding: 30rpx;
    
    .welcome-card {
      background: linear-gradient(to right, #3C8999, #55a5b5);
      border-radius: 20rpx;
      padding: 30rpx;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30rpx;
      box-shadow: 0 6rpx 16rpx rgba(60, 137, 153, 0.2);
      
      .welcome-text {
        flex: 1;
        
        .greeting {
          font-size: 44rpx;
          color: #fff;
          font-weight: bold;
          display: block;
          margin-bottom: 10rpx;
        }
        
        .message {
          font-size: 28rpx;
          color: rgba(255, 255, 255, 0.9);
          display: block;
        }
      }
      
      .welcome-image {
        width: 150rpx;
        height: 150rpx;
      }
    }
    
    .feature-cards {
      display: flex;
      margin-bottom: 30rpx;
      gap: 20rpx;
      
      .feature-card {
        flex: 1;
        background-color: #fff;
        border-radius: 20rpx;
        padding: 30rpx;
        display: flex;
        align-items: center;
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
        transition: transform 0.3s;
        
        &:active {
          transform: scale(0.98);
        }
        
        .card-icon {
          width: 80rpx;
          height: 80rpx;
          border-radius: 20rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 20rpx;
          
          .iconfont {
            font-size: 40rpx;
            color: #fff;
          }
          
          &.vocabulary-icon {
            background-color: #4dabf7;
          }
          
          &.practice-icon {
            background-color: #74c0fc;
          }
        }
        
        .card-content {
          flex: 1;
          
          .card-title {
            font-size: 28rpx;
            color: #333;
            font-weight: bold;
            display: block;
            margin-bottom: 6rpx;
          }
          
          .card-desc {
            font-size: 22rpx;
            color: #999;
            display: block;
          }
        }
        
        .card-arrow {
          font-size: 30rpx;
          color: #ccc;
          font-weight: bold;
        }
      }
    }
    
    .progress-card {
      background-color: #fff;
      border-radius: 20rpx;
      padding: 30rpx;
      margin-bottom: 30rpx;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
      
      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;
        
        .progress-title {
          font-size: 30rpx;
          color: #333;
          font-weight: bold;
        }
        
        .view-all {
          font-size: 24rpx;
          color: #3C8999;
        }
      }
      
      .progress-stats {
        display: flex;
        justify-content: space-between;
        
        .stat-item {
          flex: 1;
          text-align: center;
          padding: 10rpx;
          
          .stat-value {
            font-size: 40rpx;
            color: #3C8999;
            font-weight: bold;
            display: block;
            margin-bottom: 6rpx;
          }
          
          .stat-label {
            font-size: 22rpx;
            color: #999;
            display: block;
          }
        }
      }
    }
    
    .recommendation-section {
      margin-bottom: 100rpx;
      
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;
        
        .section-title {
          font-size: 30rpx;
          color: #333;
          font-weight: bold;
        }
        
        .view-all {
          font-size: 24rpx;
          color: #3C8999;
        }
      }
      
      .recommendation-scrollview {
        white-space: nowrap;
        
        .recommendation-item {
          display: inline-block;
          width: 200rpx;
          margin-right: 20rpx;
          vertical-align: top;
          
          .recommendation-image {
            width: 200rpx;
            height: 200rpx;
            border-radius: 16rpx;
            margin-bottom: 10rpx;
            background-color: #f0f0f0;
          }
          
          .recommendation-name {
            font-size: 26rpx;
            color: #333;
            display: block;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }
    }
  }
  
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100rpx;
    background-color: #fff;
    display: flex;
    box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
    
    .nav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      
      .iconfont {
        font-size: 40rpx;
        color: #999;
        margin-bottom: 6rpx;
      }
      
      .nav-text {
        font-size: 22rpx;
        color: #999;
      }
      
      &.active {
        .iconfont, .nav-text {
          color: #3C8999;
        }
      }
    }
  }
}
</style>