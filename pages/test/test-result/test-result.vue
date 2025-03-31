<template>
  <view class="result-container">
    <view class="result-card">
      <view class="score-section">
        <view class="score-circle">
          <text class="score-value">{{ testResult.score }}</text>
          <text class="score-total">/100</text>
        </view>
        <view class="score-details">
          <view class="detail-item">
            <text class="detail-label">正确率</text>
            <text class="detail-value">{{ testResult.accuracy.toFixed(1) }}%</text>
          </view>
          <view class="detail-item">
            <text class="detail-label">正确题数</text>
            <text class="detail-value">{{ testResult.correctCount }}/{{ testResult.totalQuestions }}</text>
          </view>
          <view class="detail-item">
            <text class="detail-label">用时</text>
            <text class="detail-value">{{ formatTime(testResult.timeSpent) }}</text>
          </view>
        </view>
      </view>
      
      <view class="result-summary">
        <view class="summary-title">测验表现</view>
        <view class="summary-content">
          {{ generateFeedback() }}
        </view>
      </view>
    </view>
    
    <view class="details-card" v-if="testResult.details && testResult.details.length > 0">
      <view class="card-title">答题详情</view>
      
      <view class="question-list">
        <view 
          v-for="(detail, index) in testResult.details" 
          :key="index"
          class="question-item"
          :class="{ 'correct': detail.isCorrect, 'incorrect': !detail.isCorrect }"
        >
          <view class="question-header">
            <text class="question-index">题目 {{ index + 1 }}</text>
            <text class="question-result">{{ detail.isCorrect ? '正确' : '错误' }}</text>
          </view>
          <view class="question-content">
            <text class="sign-name">{{ detail.signName }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <view class="action-buttons">
      <view class="action-btn retry-btn" @tap="retryTest">再测一次</view>
      <view class="action-btn return-btn" @tap="returnToHome">返回首页</view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      testResult: {
        score: 0,
        totalQuestions: 0,
        correctCount: 0,
        accuracy: 0,
        timeSpent: 0,
        details: []
      }
    }
  },
  
  onLoad() {
    // 获取由测验页面传递的结果数据
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('testResults', (data) => {
      this.testResult = data;
    });
  },
  
  methods: {
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}分${remainingSeconds}秒`;
    },
    
    generateFeedback() {
      const accuracy = this.testResult.accuracy;
      
      if (accuracy >= 90) {
        return "太棒了！你对手语的掌握已经非常出色，继续保持！";
      } else if (accuracy >= 70) {
        return "很好！你对大部分手语有了不错的理解，继续努力！";
      } else if (accuracy >= 50) {
        return "还不错，你已经掌握了基本的手语表达，但还有提升空间。";
      } else {
        return "这只是开始，多加练习，你会进步得很快！建议重点复习错误的题目。";
      }
    },
    
    retryTest() {
      // 返回测验选择页面
      uni.redirectTo({
        url: '/pages/test/test-selection'
      });
    },
    
    returnToHome() {
      // 返回首页
      uni.reLaunch({
        url: '/pages/index/index'
      });
    }
  }
}
</script>

<style lang="scss">
.result-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
  
  .result-card, .details-card {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  }
  
  .result-card {
    .score-section {
      display: flex;
      align-items: center;
      margin-bottom: 30rpx;
      
      .score-circle {
        width: 160rpx;
        height: 160rpx;
        border-radius: 80rpx;
        background: linear-gradient(to right, #3C8999, #55a5b5);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin-right: 40rpx;
        
        .score-value {
          font-size: 60rpx;
          font-weight: bold;
          color: #fff;
          line-height: 1;
        }
        
        .score-total {
          font-size: 28rpx;
          color: rgba(255, 255, 255, 0.8);
          margin-top: 5rpx;
        }
      }
      
      .score-details {
        flex: 1;
        
        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15rpx;
          
          .detail-label {
            font-size: 28rpx;
            color: #666;
          }
          
          .detail-value {
            font-size: 28rpx;
            color: #333;
            font-weight: bold;
          }
        }
      }
    }
    
    .result-summary {
      border-top: 1px solid #f0f0f0;
      padding-top: 20rpx;
      
      .summary-title {
        font-size: 30rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 15rpx;
      }
      
      .summary-content {
        font-size: 28rpx;
        color: #666;
        line-height: 1.5;
      }
    }
  }
  
  .details-card {
    .card-title {
      font-size: 30rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 20rpx;
    }
    
    .question-list {
      .question-item {
        background-color: #f9f9f9;
        border-radius: 10rpx;
        padding: 20rpx;
        margin-bottom: 15rpx;
        border-left: 8rpx solid #ccc;
        
        &.correct {
          border-left-color: #4CAF50;
        }
        
        &.incorrect {
          border-left-color: #F44336;
        }
        
        .question-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10rpx;
          
          .question-index {
            font-size: 26rpx;
            color: #666;
          }
          
          .question-result {
            font-size: 26rpx;
            font-weight: bold;
            color: #F44336;
            
            .correct & {
              color: #4CAF50;
            }
          }
        }
        
        .question-content {
          .sign-name {
            font-size: 30rpx;
            color: #333;
            font-weight: bold;
          }
        }
      }
    }
  }
  
  .action-buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 40rpx;
    
    .action-btn {
      width: 48%;
      height: 90rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 45rpx;
      font-size: 30rpx;
      font-weight: bold;
    }
    
    .retry-btn {
      background: linear-gradient(to right, #3C8999, #55a5b5);
      color: #fff;
      box-shadow: 0 6rpx 16rpx rgba(60, 137, 153, 0.3);
    }
    
    .return-btn {
      background-color: #f5f5f5;
      color: #666;
      border: 1px solid #ddd;
    }
  }
}
</style>