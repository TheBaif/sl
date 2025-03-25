<template>
  <view 
    class="home_container"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <!-- 顶部导航栏 -->
    <view class="home_top">
      <view class="user-info" @tap="navigateToUserProfile">
        <image class="avatar" :src="userInfo.userPic || '/static/avatar.png'"></image>
        <text class="username" v-if="userInfo.nickname">{{ userInfo.nickname }}</text>
      </view>
      <view class="search-icon" @tap="navigateToSearch">
        <text class="iconfont">&#xe623;</text>
      </view>
    </view>

    <!-- 中间背景和标语 -->
    <view class="back_container">
      <image
        class="center-image" 
        src="/static/home_back.png"
        mode="aspectFit"
      ></image>
      <view class="slogan">
        <text class="slogan-text">探索手语的世界</text>
        <text class="slogan-sub">让沟通无障碍</text>
      </view>
    </view>

    <!-- 功能导航区 -->
    <view class="feature-cards">
      <!-- 学习卡片 -->
      <view class="feature-card" @tap="navigateToVocabulary">
        <view class="card-icon learn-icon">
          <text class="iconfont">&#xe63a;</text>
        </view>
        <view class="card-content">
          <text class="card-title">学习手语</text>
          <text class="card-desc">浏览丰富的手语词库</text>
        </view>
        <view class="card-arrow">
          <text>›</text>
        </view>
      </view>

      <!-- 练习卡片 -->
      <view class="feature-card" @tap="navigateToPractice">
        <view class="card-icon practice-icon">
          <text class="iconfont">&#xe636;</text>
        </view>
        <view class="card-content">
          <text class="card-title">练习手语</text>
          <text class="card-desc">通过测验巩固所学</text>
        </view>
        <view class="card-arrow">
          <text>›</text>
        </view>
      </view>

      <!-- 学习进度卡片 -->
      <view class="feature-card" @tap="navigateToLearningProgress">
        <view class="card-icon progress-icon">
          <text class="iconfont">&#xe63d;</text>
        </view>
        <view class="card-content">
          <text class="card-title">学习进度</text>
          <text class="card-desc">查看您的学习统计</text>
        </view>
        <view class="card-arrow">
          <text>›</text>
        </view>
      </view>
    </view>

    <!-- 推荐学习区域 -->
    <view class="recommendation-section" v-if="recommendedSigns.length > 0">
      <view class="section-header">
        <text class="section-title">建议学习</text>
        <text class="section-more" @tap="navigateToMoreRecommendations">更多 ›</text>
      </view>
      
      <scroll-view class="recommendation-scroll" scroll-x>
        <view class="recommendation-cards">
          <view 
            class="recommendation-card" 
            v-for="(item, index) in recommendedSigns" 
            :key="index"
            @tap="navigateToSignDetail(item)"
          >
            <image 
              :src="item.imageSrc || '/static/images/default-sign.png'" 
              class="recommendation-image" 
              mode="aspectFill"
            ></image>
            <view class="recommendation-info">
              <text class="recommendation-name">{{ item.name }}</text>
              <text class="recommendation-pinyin">{{ item.pinyin }}</text>
              <view class="mastery-badge" :class="getMasteryBadgeClass(item.masteryLevel)">
                <text>{{ item.masteryLevel || '未学习' }}</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 学习提示 -->
    <view class="learning-tip">
      <view class="tip-icon">
        <text class="iconfont">&#xe67a;</text>
      </view>
      <view class="tip-content">
        <text>{{ getDailyTip() }}</text>
      </view>
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
      userInfo: {},
      recommendedSigns: [],
      learningStats: null,
      loading: false,
      tips: [
        "每天学习15分钟，坚持就会有收获",
        "学习手语不仅是一项技能，也是一种尊重",
        "复习是记忆的最佳方式，定期回顾所学内容",
        "尝试用学过的手语进行日常交流",
        "语言学习需要耐心，不要急于求成"
      ]
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
    // 添加跳转到手语词库的方法
    navigateToVocabulary() {
      uni.navigateTo({
        url: '/pages/vocabulary/index/index'
      })
    },
    
    // 跳转到练习页面
    navigateToPractice() {
      uni.navigateTo({
        url: '/pages/practice/practice'
      })
    },
    
    // 跳转到学习进度页面
    navigateToLearningProgress() {
      uni.navigateTo({
        url: '/pages/learning-progress/learning-progress'
      })
    },
    
    // 跳转到更多推荐
    navigateToMoreRecommendations() {
      uni.navigateTo({
        url: '/pages/recommendation/recommendation'
      })
    },
    
    // 获取随机学习提示
    getDailyTip() {
      const randomIndex = Math.floor(Math.random() * this.tips.length)
      return this.tips[randomIndex]
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
        
        const res = await http.get('/user/userInfo')
        if (res.data.code === 0) {
          this.userInfo = res.data.data
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    },
    
    async getRecommendations() {
      this.loading = true
      try {
        const res = await http.get('/learning/recommendations', {
          params: { limit: 5 }
        })
        
        if (res.data.code === 0) {
          this.recommendedSigns = res.data.data
        } else {
          // 使用模拟数据
          this.recommendedSigns = this.getMockRecommendations()
        }
      } catch (error) {
        console.error('获取推荐失败:', error)
        // 失败时使用模拟数据
        this.recommendedSigns = this.getMockRecommendations()
      } finally {
        this.loading = false
      }
    },
    
    // 生成模拟推荐数据
    getMockRecommendations() {
      return [
        {
          id: 1,
          name: '你好',
          pinyin: 'nǐ hǎo',
          masteryLevel: '已掌握',
          imageSrc: '/static/images/default-sign.png'
        },
        {
          id: 2,
          name: '谢谢',
          pinyin: 'xiè xiè',
          masteryLevel: '未复习',
          imageSrc: '/static/images/default-sign.png'
        },
        {
          id: 3,
          name: '再见',
          pinyin: 'zài jiàn',
          masteryLevel: '未学习',
          imageSrc: '/static/images/default-sign.png'
        },
        {
          id: 4,
          name: '朋友',
          pinyin: 'péng yǒu',
          masteryLevel: '未复习',
          imageSrc: '/static/images/default-sign.png'
        },
        {
          id: 5,
          name: '家人',
          pinyin: 'jiā rén',
          masteryLevel: '未学习',
          imageSrc: '/static/images/default-sign.png'
        }
      ]
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
    
    navigateToSignDetail(sign) {
      // 记录学习行为
      this.recordLearning(sign.id)
      
      // 将选择的手语缓存
      const results = [sign]
      uni.setStorageSync('searchResults', results)
      
      // 跳转到详情页
      uni.navigateTo({
        url: `/pages/detail/detail?index=0`
      })
    },
    
    async recordLearning(signId) {
      try {
        await http.post('/learning/record', {
          signId: signId
        })
      } catch (error) {
        console.error('记录学习行为失败:', error)
      }
    },
    
    getMasteryBadgeClass(masteryLevel) {
      if (masteryLevel === '未学习') return 'badge-not-learned'
      if (masteryLevel === '未复习') return 'badge-not-reviewed'
      return 'badge-mastered'
    }
  }
}
</script>

<style lang="scss">
.home_container {
  width: 100%;
  min-height: 100vh;
  background-color: #f8f8f8;
  padding-bottom: 30rpx;

  // 顶部导航
  .home_top {
    width: 100%;
    height: 160rpx;
    padding: 0 30rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #3C8999;

    .user-info {
      display: flex;
      align-items: center;
      
      .avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        border: 2rpx solid #fff;
      }
      
      .username {
        color: #fff;
        font-size: 28rpx;
        margin-left: 16rpx;
        max-width: 200rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    
    .search-icon {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      
      .iconfont {
        color: #fff;
        font-size: 28rpx;
      }
    }
  }

  // 中间背景区域
  .back_container {
    position: relative;
    display: flex;
    justify-content: center;
    height: 400rpx;
    background-color: #3C8999;
    overflow: hidden;

    .center-image {
      width: 100%;
      height: 100%;
      opacity: 0.8;
    }
    
    .slogan {
      position: absolute;
      left: 40rpx;
      bottom: 60rpx;
      color: #fff;
      z-index: 1;
      
      .slogan-text {
        font-size: 48rpx;
        font-weight: bold;
        display: block;
        margin-bottom: 12rpx;
        text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.2);
      }
      
      .slogan-sub {
        font-size: 32rpx;
        opacity: 0.9;
        text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
      }
    }
  }
  
  // 功能卡片区域
  .feature-cards {
    margin-top: -50rpx;
    padding: 0 30rpx;
    
    .feature-card {
      display: flex;
      align-items: center;
      background-color: #fff;
      border-radius: 16rpx;
      padding: 30rpx;
      margin-bottom: 20rpx;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
      
      &:active {
        transform: scale(0.98);
      }
      
      .card-icon {
        width: 80rpx;
        height: 80rpx;
        border-radius: 16rpx;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 20rpx;
        
        .iconfont {
          font-size: 40rpx;
          color: #fff;
        }
        
        &.learn-icon {
          background-color: #3C8999;
        }
        
        &.practice-icon {
          background-color: #5C6BC0;
        }
        
        &.progress-icon {
          background-color: #66BB6A;
        }
      }
      
      .card-content {
        flex: 1;
        
        .card-title {
          font-size: 32rpx;
          color: #333;
          font-weight: 500;
          margin-bottom: 8rpx;
          display: block;
        }
        
        .card-desc {
          font-size: 24rpx;
          color: #999;
        }
      }
      
      .card-arrow {
        color: #bbb;
        font-size: 36rpx;
        font-weight: bold;
      }
    }
  }
  
  // 推荐区域
  .recommendation-section {
    margin-top: 40rpx;
    padding: 0 30rpx;
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;
      
      .section-title {
        font-size: 34rpx;
        font-weight: bold;
        color: #333;
      }
      
      .section-more {
        font-size: 26rpx;
        color: #3C8999;
      }
    }
    
    .recommendation-scroll {
      white-space: nowrap;
      
      .recommendation-cards {
        display: flex;
        padding: 10rpx 0;
        
        .recommendation-card {
          display: inline-block;
          width: 300rpx;
          margin-right: 20rpx;
          background-color: #fff;
          border-radius: 16rpx;
          overflow: hidden;
          box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
          
          &:active {
            transform: scale(0.98);
          }
          
          .recommendation-image {
            width: 100%;
            height: 180rpx;
            object-fit: cover;
          }
          
          .recommendation-info {
            padding: 16rpx;
            
            .recommendation-name {
              font-size: 28rpx;
              color: #333;
              font-weight: 500;
              margin-bottom: 6rpx;
              display: block;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            
            .recommendation-pinyin {
              font-size: 22rpx;
              color: #999;
              display: block;
              margin-bottom: 10rpx;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            
            .mastery-badge {
              display: inline-block;
              padding: 4rpx 16rpx;
              border-radius: 20rpx;
              font-size: 20rpx;
              
              &.badge-not-learned {
                background-color: rgba(224, 224, 224, 0.3);
                color: #999;
              }
              
              &.badge-not-reviewed {
                background-color: rgba(166, 225, 232, 0.3);
                color: #3C8999;
              }
              
              &.badge-mastered {
                background-color: rgba(60, 137, 153, 0.2);
                color: #3C8999;
              }
            }
          }
        }
      }
    }
  }
  
  // 学习提示
  .learning-tip {
    margin: 40rpx 30rpx 20rpx;
    background-color: #fff;
    border-radius: 16rpx;
    padding: 20rpx;
    display: flex;
    align-items: center;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    
    .tip-icon {
      width: 60rpx;
      height: 60rpx;
      border-radius: 50%;
      background-color: rgba(60, 137, 153, 0.1);
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 20rpx;
      
      .iconfont {
        font-size: 32rpx;
        color: #3C8999;
      }
    }
    
    .tip-content {
      flex: 1;
      
      text {
        font-size: 26rpx;
        color: #666;
        line-height: 1.5;
      }
    }
  }
}
</style>