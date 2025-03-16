<template>
  <view class="recommendation-container">
    <view class="section-header">
      <text class="section-title">为您推荐</text>
      <text class="section-subtitle">基于您的学习进度定制</text>
    </view>
    
    <view class="recommendation-list">
      <view v-if="loading" class="loading">
        <view class="loader"></view>
        <text>正在加载推荐内容...</text>
      </view>
      
      <template v-else>
        <view 
          v-for="(item, index) in recommendations" 
          :key="index"
          class="recommendation-item"
          @tap="goToSignDetail(item)"
        >
          <image 
            :src="item.imageSrc || '/static/images/default-sign.png'" 
            class="recommendation-image" 
            mode="aspectFill"
          ></image>
          <view class="recommendation-info">
            <text class="recommendation-name">{{ item.name }}</text>
            <text class="recommendation-pinyin">{{ item.pinyin }}</text>
            <view class="recommendation-tag" v-if="getRecommendationReason(item)">
              <text>{{ getRecommendationReason(item) }}</text>
            </view>
          </view>
        </view>
      </template>
      
      <view v-if="!loading && recommendations.length === 0" class="empty-state">
        <text>暂无推荐内容</text>
      </view>
    </view>
  </view>
</template>

<script>
import http from '@/utils/request.js'

export default {
  data() {
    return {
      loading: true,
      recommendations: []
    }
  },
  
  mounted() {
    this.loadRecommendations()
  },
  
  methods: {
    async loadRecommendations() {
      this.loading = true
      
      try {
        const res = await http.get('/learning/recommendations', {
          params: { limit: 5 }
        })
        
        if (res.data.code === 0) {
          this.recommendations = res.data.data
        } else {
          uni.showToast({
            title: '获取推荐失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('加载推荐内容失败:', error)
        uni.showToast({
          title: '获取推荐失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    goToSignDetail(sign) {
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
    
    getRecommendationReason(item) {
      // 根据不同标准提供推荐理由
      if (item.difficulty === 'BEGINNER') {
        return '入门级别'
      } else if (item.difficulty === 'INTERMEDIATE') {
        return '提升难度'
      } else if (item.difficulty === 'ADVANCED') {
        return '挑战自我'
      } else if (item.category === 'HIGH_FREQUENCY') {
        return '高频使用'
      }
      return '适合您的水平'
    }
  }
}
</script>

<style lang="scss">
.recommendation-container {
  padding: 30rpx;
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  
  .section-header {
    margin-bottom: 20rpx;
    
    .section-title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      display: block;
    }
    
    .section-subtitle {
      font-size: 24rpx;
      color: #999;
      margin-top: 8rpx;
      display: block;
    }
  }
  
  .recommendation-list {
    .recommendation-item {
      display: flex;
      align-items: center;
      padding: 20rpx 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      &:active {
        background-color: #f9f9f9;
      }
      
      .recommendation-image {
        width: 100rpx;
        height: 100rpx;
        border-radius: 10rpx;
        margin-right: 20rpx;
        object-fit: cover;
      }
      
      .recommendation-info {
        flex: 1;
        
        .recommendation-name {
          font-size: 32rpx;
          color: #333;
          font-weight: 500;
          margin-bottom: 6rpx;
          display: block;
        }
        
        .recommendation-pinyin {
          font-size: 24rpx;
          color: #999;
          margin-bottom: 10rpx;
          display: block;
        }
        
        .recommendation-tag {
          display: inline-block;
          background-color: rgba(60, 137, 153, 0.1);
          padding: 4rpx 12rpx;
          border-radius: 20rpx;
          
          text {
            font-size: 22rpx;
            color: #3C8999;
          }
        }
      }
    }
    
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40rpx 0;
      
      .loader {
        width: 40rpx;
        height: 40rpx;
        border-radius: 50%;
        border: 4rpx solid rgba(60, 137, 153, 0.2);
        border-top-color: #3C8999;
        animation: spin 1s infinite linear;
        margin-bottom: 20rpx;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      text {
        font-size: 26rpx;
        color: #999;
      }
    }
    
    .empty-state {
      padding: 40rpx 0;
      text-align: center;
      
      text {
        font-size: 26rpx;
        color: #999;
      }
    }
  }
}
</style>