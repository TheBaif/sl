<template>
  <view class="test-container">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading">
      <view class="loader"></view>
      <text>正在加载测验题目...</text>
    </view>
    
    <!-- 测验内容 -->
    <view v-else class="test-content">
      <!-- 进度条 -->
      <view class="progress-bar">
        <view class="progress-bg">
          <view class="progress-fill" :style="{width: progressPercentage + '%'}"></view>
        </view>
        <view class="progress-text">
          <text>{{currentIndex + 1}}/{{questions.length}}</text>
        </view>
      </view>
      
      <!-- 当前题目 -->
      <view class="question-card" v-if="currentQuestion">
        <view class="question-title">
          <text>{{currentQuestion.question}}</text>
        </view>
        
        <view class="question-image">
          <image 
            :src="currentQuestion.imageSrc || '/static/image-placeholder.png'" 
            mode="aspectFit"
          ></image>
        </view>
        
        <view class="options-list">
          <view 
            v-for="(option, index) in currentQuestion.options" 
            :key="option.id"
            class="option-item"
            :class="{
              'selected': selectedOptionId === option.id,
              'correct': showAnswer && option.isCorrect,
              'incorrect': showAnswer && selectedOptionId === option.id && !option.isCorrect
            }"
            @tap="selectOption(option)"
          >
            <text class="option-prefix">{{String.fromCharCode(65 + index)}}</text>
            <text class="option-text">{{option.text}}</text>
            <view v-if="showAnswer" class="answer-icon">
              <text v-if="option.isCorrect" class="correct-icon">✓</text>
              <text v-else-if="selectedOptionId === option.id" class="incorrect-icon">✗</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 导航按钮 -->
      <view class="nav-buttons">
        <view 
          v-if="showAnswer" 
          class="next-btn"
          @tap="goToNextQuestion"
        >
          {{isLastQuestion ? '完成测验' : '下一题'}}
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
      questions: [],
      currentIndex: 0,
      selectedOptionId: null,
      showAnswer: false,
      answers: [],
      startTime: null,
      questionStartTime: null
    }
  },
  
  computed: {
    currentQuestion() {
      return this.questions[this.currentIndex] || null;
    },
    
    progressPercentage() {
      return (this.currentIndex / this.questions.length) * 100;
    },
    
    isLastQuestion() {
      return this.currentIndex === this.questions.length - 1;
    }
  },
  
  onLoad(options) {
    this.loadQuestions(options);
    this.startTime = new Date();
  },
  
  methods: {
    async loadQuestions(options) {
      try {
        this.loading = true;
        
        // 构建请求参数
        const params = {};
        
        if (options.limit) {
          params.limit = parseInt(options.limit);
        }
        
        if (options.difficulty) {
          params.difficulty = options.difficulty;
        }
        
        if (options.category) {
          params.category = parseInt(options.category);
        }
        
        // 发送请求获取题目
        const res = await http.get('/test/questions', { params });
        
        if (res.data.code === 0 && res.data.data) {
          this.questions = res.data.data;
          
          // 初始化答案数组
          this.answers = new Array(this.questions.length).fill(null);
          
          // 记录第一题开始时间
          this.questionStartTime = new Date();
        } else {
          throw new Error(res.data.message || '获取题目失败');
        }
      } catch (error) {
        console.error('加载测验题目失败:', error);
        uni.showToast({
          title: '加载测验题目失败',
          icon: 'none'
        });
        
        // 返回上一页
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
      } finally {
        this.loading = false;
      }
    },
    
    selectOption(option) {
      // 如果已经显示答案，则不允许再次选择
      if (this.showAnswer) return;
      
      this.selectedOptionId = option.id;
      this.showAnswer = true;
      
      // 计算本题用时（秒）
      const now = new Date();
      const timeSpent = Math.round((now - this.questionStartTime) / 1000);
      
      // 记录答案
      const isCorrect = option.isCorrect === true;
      this.answers[this.currentIndex] = {
        questionId: this.currentQuestion.id,
        answerId: option.id,
        isCorrect: isCorrect,
        timeSpent: timeSpent
      };
      
      // 播放音效
      this.playAnswerSound(isCorrect);
    },
    
    playAnswerSound(isCorrect) {
      const audioContext = uni.createInnerAudioContext();
      audioContext.src = isCorrect ? '/static/audio/correct.mp3' : '/static/audio/wrong.mp3';
      audioContext.play();
    },
    
    goToNextQuestion() {
      if (this.isLastQuestion) {
        this.finishTest();
      } else {
        this.currentIndex++;
        this.selectedOptionId = null;
        this.showAnswer = false;
        this.questionStartTime = new Date();
      }
    },
    
    async finishTest() {
      try {
        this.loading = true;
        
        // 提交测验结果
        const submitData = {
          answers: this.answers.filter(answer => answer !== null)
        };
        
        const res = await http.post('/test/submit', submitData);
        
        if (res.data.code === 0 && res.data.data) {
          // 导航到结果页面，传递结果数据
          uni.navigateTo({
            url: '/pages/test/test-result',
            success: (page) => {
              // 传递结果数据给结果页面
              page.eventChannel.emit('testResults', res.data.data);
            }
          });
        } else {
          throw new Error(res.data.message || '提交测验结果失败');
        }
      } catch (error) {
        console.error('提交测验结果失败:', error);
        uni.showToast({
          title: '提交测验结果失败',
          icon: 'none'
        });
        
        // 返回上一页
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style lang="scss">
.test-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
  
  .loading {
    height: 400rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    
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
      font-size: 28rpx;
      color: #999;
    }
  }
  
  .test-content {
    .progress-bar {
      margin-bottom: 30rpx;
      
      .progress-bg {
        height: 16rpx;
        background-color: rgba(60, 137, 153, 0.2);
        border-radius: 8rpx;
        overflow: hidden;
        
        .progress-fill {
          height: 100%;
          background-color: #3C8999;
          border-radius: 8rpx;
          transition: width 0.3s ease;
        }
      }
      
      .progress-text {
        text-align: right;
        margin-top: 10rpx;
        
        text {
          font-size: 24rpx;
          color: #666;
        }
      }
    }
    
    .question-card {
      background-color: #fff;
      border-radius: 16rpx;
      padding: 30rpx;
      margin-bottom: 30rpx;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
      
      .question-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 20rpx;
        text-align: center;
      }
      
      .question-image {
        width: 100%;
        height: 400rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 30rpx;
        
        image {
          max-width: 100%;
          max-height: 100%;
          border-radius: 10rpx;
        }
      }
      
      .options-list {
        .option-item {
          display: flex;
          align-items: center;
          padding: 20rpx;
          background-color: #f5f5f5;
          border-radius: 10rpx;
          margin-bottom: 20rpx;
          position: relative;
          
          &.selected {
            background-color: rgba(60, 137, 153, 0.2);
            border: 2rpx solid #3C8999;
          }
          
          &.correct {
            background-color: rgba(76, 175, 80, 0.2);
            border: 2rpx solid #4CAF50;
          }
          
          &.incorrect {
            background-color: rgba(244, 67, 54, 0.2);
            border: 2rpx solid #F44336;
          }
          
          .option-prefix {
            width: 60rpx;
            height: 60rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #fff;
            border-radius: 30rpx;
            font-size: 28rpx;
            font-weight: bold;
            color: #3C8999;
            margin-right: 20rpx;
          }
          
          .option-text {
            flex: 1;
            font-size: 30rpx;
            color: #333;
          }
          
          .answer-icon {
            margin-left: 20rpx;
            
            .correct-icon {
              font-size: 36rpx;
              color: #4CAF50;
            }
            
            .incorrect-icon {
              font-size: 36rpx;
              color: #F44336;
            }
          }
        }
      }
    }
    
    .nav-buttons {
      .next-btn {
        height: 90rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(to right, #3C8999, #55a5b5);
        border-radius: 45rpx;
        color: #fff;
        font-size: 32rpx;
        font-weight: bold;
        box-shadow: 0 6rpx 16rpx rgba(60, 137, 153, 0.3);
      }
    }
  }
}
</style>