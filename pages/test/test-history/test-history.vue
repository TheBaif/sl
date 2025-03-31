<template>
  <view class="history-container">
    <view class="header">
      <view class="back-button" @tap="navigateBack">
        <text class="iconfont">&#xe679;</text>
      </view>
      <view class="title">测验历史</view>
    </view>
    
    <view v-if="loading" class="loading-section">
      <view class="loader"></view>
      <text>加载中...</text>
    </view>
    
    <view v-else-if="errorMessage" class="error-section">
      <text>{{ errorMessage }}</text>
      <view class="retry-btn" @tap="loadTestHistory">重试</view>
    </view>
    
    <view v-else class="history-content">
      <view v-if="historyList.length === 0" class="empty-state">
        <image src="/static/empty.png" mode="aspectFit" class="empty-image"></image>
        <text>暂无测验记录</text>
        <view class="start-test-btn" @tap="goToTestSelection">开始测验</view>
      </view>
      
      <view v-else class="history-list">
        <view 
          v-for="(item, index) in historyList" 
          :key="index"
          class="history-item"
        >
          <view class="item-left">
            <text class="test-time">{{ formatDate(item.testTime) }}</text>
            <text class="test-difficulty">{{ getDifficultyLabel(item.difficulty) }}</text>
          </view>
          
          <view class="item-center">
            <view class="stats-row">
              <text class="stats-label">得分</text>
              <text class="stats-value">{{ item.score }}</text>
            </view>
            <view class="stats-row">
              <text class="stats-label">正确率</text>
              <text class="stats-value">{{ item.accuracy.toFixed(1) }}%</text>
            </view>
            <view class="stats-row">
              <text class="stats-label">题数</text>
              <text class="stats-value">{{ item.totalQuestions }}</text>
            </view>
          </view>
          
          <view class="item-right">
            <view class="score-circle" :class="getScoreClass(item.score)">
              <text>{{ item.score }}</text>
            </view>
          </view>
        </view>
        
        <view v-if="hasMore" class="load-more" @tap="loadMore">
          <text>加载更多</text>
        </view>
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
      errorMessage: '',
      historyList: [],
      currentPage: 1,
      pageSize: 10,
      hasMore: false
    }
  },
  
  onLoad() {
    this.loadTestHistory()
  },
  
  methods: {
    async loadTestHistory() {
      try {
        this.loading = true
        this.errorMessage = ''
        
        const res = await http.get('/test/history', {
          params: {
            page: this.currentPage,
            limit: this.pageSize
          }
        })
        
        if (res.data.code === 0) {
          // 添加新数据
          const newData = res.data.data || []
          this.historyList = [...this.historyList, ...newData]
          
          // 判断是否还有更多数据
          this.hasMore = newData.length === this.pageSize
        } else {
          throw new Error(res.data.message || '获取测验历史失败')
        }
      } catch (error) {
        console.error('加载测验历史失败:', error)
        this.errorMessage = '加载测验历史失败: ' + (error.message || '请检查网络')
      } finally {
        this.loading = false
      }
    },
    
    loadMore() {
      this.currentPage++
      this.loadTestHistory()
    },
    
    navigateBack() {
      uni.navigateBack()
    },
    
    goToTestSelection() {
      uni.navigateTo({
        url: '/pages/test/test-selection'
      })
    },
    
    formatDate(dateStr) {
      if (!dateStr) return ''
      
      const date = new Date(dateStr)
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      const hour = date.getHours().toString().padStart(2, '0')
      const minute = date.getMinutes().toString().padStart(2, '0')
      
      return `${year}-${month}-${day} ${hour}:${minute}`
    },
    
    getDifficultyLabel(difficulty) {
      const difficultyMap = {
        'BEGINNER': '入门',
        'INTERMEDIATE': '中级',
        'ADVANCED': '高级',
        'MIXED': '混合'
      }
      
      return difficultyMap[difficulty] || difficulty
    },
    
    getScoreClass(score) {
      if (score >= 90) return 'excellent'
      if (score >= 70) return 'good'
      if (score >= 60) return 'pass'
      return 'fail'
    }
  }
}
</script>

<style lang="scss">
.history-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
  
  .header {
    display: flex;
    align-items: center;
    margin-bottom: 30rpx;
    
    .back-button {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(60, 137, 153, 0.1);
      border-radius: 30rpx;
      margin-right: 20rpx;
      
      .iconfont {
        font-size: 30rpx;
        color: #3C8999;
      }
    }
    
    .title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
    }
  }
  
  .loading-section, .error-section {
    height: 300rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #fff;
    border-radius: 16rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    
    .loader {
      width: 60rpx;
      height: 60rpx;
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
      color: #999;
      font-size: 28rpx;
    }
    
    .retry-btn {
      margin-top: 20rpx;
      padding: 10rpx 30rpx;
      background-color: #3C8999;
      color: #fff;
      border-radius: 30rpx;
      font-size: 26rpx;
    }
  }
  
  .history-content {
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60rpx 0;
      background-color: #fff;
      border-radius: 16rpx;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
      
      .empty-image {
        width: 200rpx;
        height: 200rpx;
        margin-bottom: 30rpx;
        opacity: 0.5;
      }
      
      text {
        font-size: 28rpx;
        color: #999;
        margin-bottom: 30rpx;
      }
      
      .start-test-btn {
        padding: 15rpx 40rpx;
        background-color: #3C8999;
        color: #fff;
        border-radius: 30rpx;
        font-size: 28rpx;
      }
    }
    
    .history-list {
      background-color: #fff;
      border-radius: 16rpx;
      padding: 20rpx;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
      
      .history-item {
        display: flex;
        align-items: center;
        padding: 20rpx;
        border-bottom: 1px solid #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        .item-left {
          width: 200rpx;
          margin-right: 20rpx;
          
          .test-time {
            font-size: 24rpx;
            color: #666;
            display: block;
            margin-bottom: 10rpx;
          }
          
          .test-difficulty {
            font-size: 24rpx;
            color: #3C8999;
            background-color: rgba(60, 137, 153, 0.1);
            padding: 4rpx 10rpx;
            border-radius: 10rpx;
            display: inline-block;
          }
        }
        
        .item-center {
          flex: 1;
          
          .stats-row {
            display: flex;
            margin-bottom: 8rpx;
            
            .stats-label {
              width: 80rpx;
              font-size: 26rpx;
              color: #999;
            }
            
            .stats-value {
              font-size: 26rpx;
              color: #333;
              font-weight: bold;
            }
          }
        }
        
        .item-right {
          margin-left: 20rpx;
          
          .score-circle {
            width: 80rpx;
            height: 80rpx;
            border-radius: 40rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28rpx;
            font-weight: bold;
            color: #fff;
            
            &.excellent {
              background-color: #4CAF50;
            }
            
            &.good {
              background-color: #2196F3;
            }
            
            &.pass {
              background-color: #FF9800;
            }
            
            &.fail {
              background-color: #F44336;
            }
          }
        }
      }
      
      .load-more {
        text-align: center;
        padding: 20rpx 0;
        border-top: 1px solid #f0f0f0;
        
        text {
          font-size: 28rpx;
          color: #666;
        }
      }
    }
  }
}
</style>