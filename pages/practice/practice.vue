<template>
  <view class="practice-container">
    <!-- 返回按钮 -->
    <view class="header">
      <view class="back-button" @tap="navigateBack">
        <text class="back-icon">&#xe679;</text>
      </view>
    </view>
    
    <!-- 图片区域 -->
    <view class="image-container">
      <image 
        :src="currentQuestion.imageSrc" 
        mode="aspectFit" 
        class="sign-image"
      ></image>
    </view>
    
    <!-- 选项区域 -->
    <view class="options-container">
      <view 
        v-for="(option, index) in options" 
        :key="index"
        class="option-item"
        :class="getOptionClass(option)"
        @tap="selectOption(option)"
      >
        <text class="option-text">{{ option.name }}</text>
        <text class="option-result" v-if="selectedOption && option.id === currentQuestion.id">✓</text>
        <text class="option-result" v-else-if="selectedOption && option.id !== currentQuestion.id">✗</text>
      </view>
    </view>
    
    <!-- 下一题按钮 -->
    <view v-if="selectedOption" class="next-button" @tap="nextQuestion">
      <text>下一题</text>
    </view>
    
    <!-- 进度和分数 -->
    <view class="progress-bar">
      <text class="score">得分: {{ score }} / {{ totalQuestions }}</text>
      <text class="question-count">第 {{ currentQuestionIndex + 1 }} / {{ totalQuestions }} 题</text>
    </view>
  </view>
</template>

<script>
import http from '@/utils/request.js'

export default {
  data() {
    return {
      allSigns: [],
      currentQuestion: null,
      options: [],
      selectedOption: null,
      score: 0,
      totalQuestions: 10,
      currentQuestionIndex: 0,
      loading: true
    }
  },
  onLoad() {
    this.checkLogin();
  },
  methods: {
    // 检查登录状态
    checkLogin() {
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/login/login'
          });
        }, 1500);
        return;
      }
      this.loadData();
    },
    
    // 加载所有手语数据
    async loadData() {
      this.loading = true;
      
      try {
        const token = uni.getStorageSync('token');
        // 获取全部手语数据
        const res = await http.get('/sign/list', {
          params: {
            pageNum: 1,
            pageSize: 100
          },
          header: {
            'Authorization': token
          }
        });
        
        // 处理数据
        if (res.statusCode === 200 && res.data.code === 0) {
          if (res.data.data && res.data.data.records) {
            this.allSigns = res.data.data.records.filter(item => item.imageSrc); // 只使用有图片的手语
          } else if (res.data.data && Array.isArray(res.data.data)) {
            this.allSigns = res.data.data.filter(item => item.imageSrc);
          } else {
            // 如果没有获取到数据，使用模拟数据
            this.allSigns = this.getMockData();
          }
          
          // 如果数据太少，使用模拟数据补充
          if (this.allSigns.length < 10) {
            this.allSigns = [...this.allSigns, ...this.getMockData()];
          }
          
          // 开始练习
          this.prepareQuestion();
        } else {
          // 如果API失败，使用模拟数据
          this.allSigns = this.getMockData();
          this.prepareQuestion();
        }
      } catch (err) {
        console.error('加载数据失败:', err);
        // 出错时使用模拟数据
        this.allSigns = this.getMockData();
        this.prepareQuestion();
      } finally {
        this.loading = false;
      }
    },
    
    // 准备新题目
    prepareQuestion() {
      // 随机选择一个手语作为当前问题
      if (this.allSigns.length === 0) {
        uni.showToast({
          title: '没有足够的练习数据',
          icon: 'none'
        });
        return;
      }
      
      // 从剩余手语中随机选择一个作为问题
      const randomIndex = Math.floor(Math.random() * this.allSigns.length);
      this.currentQuestion = this.allSigns[randomIndex];
      
      // 移除当前问题，避免重复
      this.allSigns.splice(randomIndex, 1);
      
      // 准备选项
      this.prepareOptions();
      
      // 重置选择状态
      this.selectedOption = null;
    },
    
    // 准备选项
    prepareOptions() {
      // 添加正确选项
      const options = [this.currentQuestion];
      
      // 添加3个错误选项
      const availableSigns = [...this.allSigns];
      
      for (let i = 0; i < 3 && availableSigns.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableSigns.length);
        options.push(availableSigns[randomIndex]);
        availableSigns.splice(randomIndex, 1);
      }
      
      // 如果没有足够的选项，添加模拟数据
      const mockOptions = this.getMockOptions();
      while (options.length < 4) {
        options.push(mockOptions[options.length - 1]);
      }
      
      // 随机排序选项
      this.options = this.shuffleArray(options);
    },
    
    // 数组随机排序
    shuffleArray(array) {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
    },
    
    // 选择选项
    selectOption(option) {
      // 已经选择过则不再处理
      if (this.selectedOption) return;
      
      this.selectedOption = option;
      
      // 判断是否正确
      if (option.id === this.currentQuestion.id) {
        this.score++;
        // 播放正确音效
        const correctAudio = uni.createInnerAudioContext();
        correctAudio.src = '/static/audio/correct.mp3'; // 确保项目中有这个音频文件
        correctAudio.play();
      } else {
        // 播放错误音效
        const wrongAudio = uni.createInnerAudioContext();
        wrongAudio.src = '/static/audio/wrong.mp3'; // 确保项目中有这个音频文件
        wrongAudio.play();
      }
    },
    
    // 获取选项类名
    getOptionClass(option) {
      if (!this.selectedOption) return '';
      
      if (option.id === this.currentQuestion.id) {
        return 'option-correct';
      } else if (option.id === this.selectedOption.id) {
        return 'option-wrong';
      }
      
      return 'option-disabled';
    },
    
    // 下一题
    nextQuestion() {
      this.currentQuestionIndex++;
      
      // 检查是否完成所有题目
      if (this.currentQuestionIndex >= this.totalQuestions) {
        this.showResult();
        return;
      }
      
      this.prepareQuestion();
    },
    
    // 显示最终结果
    showResult() {
      const percentage = Math.round((this.score / this.totalQuestions) * 100);
      
      uni.showModal({
        title: '练习完成',
        content: `你的得分：${this.score}/${this.totalQuestions} (${percentage}%)`,
        confirmText: '再来一次',
        cancelText: '返回',
        success: (res) => {
          if (res.confirm) {
            // 重新开始
            this.resetPractice();
          } else {
            // 返回首页
            uni.navigateBack();
          }
        }
      });
    },
    
    // 重置练习
    resetPractice() {
      this.score = 0;
      this.currentQuestionIndex = 0;
      this.selectedOption = null;
      this.loadData(); // 重新加载数据
    },
    
    // 返回上一页
    navigateBack() {
      uni.navigateBack();
    },
    
    // 模拟数据
    getMockData() {
      return [
        {
          id: 1,
          name: '握手',
          pinyin: 'wò shǒu',
          gesture: '双手相握，上下晃动',
          imageSrc: 'https://example.com/images/handshake.jpg' // 实际使用时替换为本地路径
        },
        {
          id: 2,
          name: '你好',
          pinyin: 'nǐ hǎo',
          gesture: '右手在胸前挥动',
          imageSrc: 'https://example.com/images/hello.jpg'
        },
        {
          id: 3,
          name: '谢谢',
          pinyin: 'xiè xiè',
          gesture: '右手在胸前轻拍',
          imageSrc: 'https://example.com/images/thanks.jpg'
        },
        {
          id: 4,
          name: '再见',
          pinyin: 'zài jiàn',
          gesture: '挥手示意',
          imageSrc: 'https://example.com/images/goodbye.jpg'
        },
        {
          id: 5,
          name: '吃饭',
          pinyin: 'chī fàn',
          gesture: '手指并拢靠近嘴',
          imageSrc: 'https://example.com/images/eat.jpg'
        },
        {
          id: 6,
          name: '喝水',
          pinyin: 'hē shuǐ',
          gesture: '握拳靠近嘴',
          imageSrc: 'https://example.com/images/drink.jpg'
        },
        {
          id: 7,
          name: '睡觉',
          pinyin: 'shuì jiào',
          gesture: '手掌放在脸颊',
          imageSrc: 'https://example.com/images/sleep.jpg'
        },
        {
          id: 8,
          name: '朋友',
          pinyin: 'péng yǒu',
          gesture: '双手食指交叉',
          imageSrc: 'https://example.com/images/friend.jpg'
        },
        {
          id: 9,
          name: '家人',
          pinyin: 'jiā rén',
          gesture: '双手合拢',
          imageSrc: 'https://example.com/images/family.jpg'
        },
        {
          id: 10,
          name: '学习',
          pinyin: 'xué xí',
          gesture: '手指敲额头',
          imageSrc: 'https://example.com/images/study.jpg'
        },
        {
          id: 11,
          name: '工作',
          pinyin: 'gōng zuò',
          gesture: '双手交替',
          imageSrc: 'https://example.com/images/work.jpg'
        },
        {
          id: 12,
          name: '爱',
          pinyin: 'ài',
          gesture: '双手交叉放在胸前',
          imageSrc: 'https://example.com/images/love.jpg'
        }
      ];
    },
    
    // 获取模拟选项
    getMockOptions() {
      return [
        { id: 101, name: '搭', pinyin: 'dā' },
        { id: 102, name: '本', pinyin: 'běn' },
        { id: 103, name: '逗', pinyin: 'dòu' },
        { id: 104, name: '笑', pinyin: 'xiào' }
      ];
    }
  }
}
</script>

<style lang="scss">
.practice-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  
  .header {
    height: 80rpx;
    display: flex;
    align-items: center;
    
    .back-button {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40rpx;
      color: #333;
    }
  }
  
  .image-container {
    margin: 30rpx 0;
    background: #fff;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    padding: 30rpx;
    
    .sign-image {
      width: 100%;
      height: 400rpx;
      object-fit: contain;
    }
  }
  
  .options-container {
    margin: 30rpx 0;
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    
    .option-item {
      background-color: #fff;
      border-radius: 16rpx;
      padding: 30rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      min-height: 100rpx;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
      transition: all 0.3s;
      
      &:active {
        transform: scale(0.98);
      }
      
      .option-text {
        font-size: 36rpx;
        color: #333;
      }
      
      .option-result {
        position: absolute;
        right: 30rpx;
        font-size: 40rpx;
      }
      
      &.option-correct {
        background-color: rgba(142, 255, 123, 0.3);
        border: 2rpx solid #4caf50;
        
        .option-result {
          color: #4caf50;
        }
      }
      
      &.option-wrong {
        background-color: rgba(255, 123, 123, 0.3);
        border: 2rpx solid #f44336;
        
        .option-result {
          color: #f44336;
        }
      }
      
      &.option-disabled {
        opacity: 0.6;
      }
    }
  }
  
  .next-button {
    margin: 30rpx 0;
    background: linear-gradient(to right, #3C8999, #55a5b5);
    border-radius: 50rpx;
    height: 90rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 6rpx 16rpx rgba(60, 137, 153, 0.3);
    
    text {
      color: #fff;
      font-size: 32rpx;
      font-weight: bold;
    }
    
    &:active {
      transform: scale(0.98);
    }
  }
  
  .progress-bar {
    margin-top: 30rpx;
    display: flex;
    justify-content: space-between;
    
    text {
      font-size: 28rpx;
      color: #666;
    }
  }
}
</style>