<template>
  <view class="container">
    <view class="header">
      <view class="back-button" @tap="navigateBack">
        <text class="iconfont">&#xe679;</text>
      </view>
      <view class="title">手语测验</view>
    </view>

    <view class="test-options">
      <view class="option-card">
        <view class="card-title">测验难度</view>
        <view class="difficulty-options">
          <view 
            v-for="(item, index) in difficulties" 
            :key="index"
            class="difficulty-item"
            :class="{ active: selectedDifficulty === item.value }"
            @tap="selectedDifficulty = item.value"
          >
            <text>{{ item.label }}</text>
          </view>
        </view>
      </view>

      <view class="option-card">
        <view class="card-title">测验题目数量</view>
        <view class="question-count">
          <view class="count-control">
            <view class="count-btn" @tap="decreaseCount">-</view>
            <view class="count-value">{{ questionCount }}</view>
            <view class="count-btn" @tap="increaseCount">+</view>
          </view>
        </view>
      </view>

      <view class="option-card">
        <view class="card-title">测验范围</view>
        <view class="scope-selection">
          <radio-group @change="handleScopeChange">
            <label class="scope-item">
              <radio value="all" :checked="testScope === 'all'" color="#3C8999" />
              <text>全部手语</text>
            </label>
            <label class="scope-item">
              <radio value="learned" :checked="testScope === 'learned'" color="#3C8999" />
              <text>已学习内容</text>
            </label>
            <label class="scope-item">
              <radio value="category" :checked="testScope === 'category'" color="#3C8999" />
              <text>选择分类</text>
            </label>
          </radio-group>
        </view>

        <view v-if="testScope === 'category'" class="category-selection">
          <picker @change="handleCategoryChange" :value="categoryIndex" :range="categories" range-key="name">
            <view class="category-picker">
              <text>{{ selectedCategory ? selectedCategory.name : '请选择分类' }}</text>
              <text class="iconfont">&#xe65e;</text>
            </view>
          </picker>
        </view>
      </view>

      <view class="start-btn" @tap="startTest">开始测验</view>
    </view>
  </view>
</template>

<script>
import http from '@/utils/request.js'

export default {
  data() {
    return {
      difficulties: [
        { label: '入门', value: 'BEGINNER' },
        { label: '中级', value: 'INTERMEDIATE' },
        { label: '高级', value: 'ADVANCED' }
      ],
      selectedDifficulty: 'BEGINNER',
      questionCount: 10,
      testScope: 'all',
      categories: [],
      categoryIndex: 0,
      selectedCategory: null
    }
  },
  
  onLoad() {
    this.loadCategories()
  },
  
  methods: {
    async loadCategories() {
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.navigateTo({ url: '/pages/login/login' })
          return
        }
        
        // 加载父类别作为测验分类选项
        const res = await http.get('/parentSign/list')
        if (res.data.code === 0 && res.data.data) {
          this.categories = res.data.data
          if (this.categories.length > 0) {
            this.selectedCategory = this.categories[0]
          }
        }
      } catch (error) {
        console.error('加载分类失败:', error)
        uni.showToast({
          title: '加载分类失败',
          icon: 'none'
        })
      }
    },
    
    navigateBack() {
      uni.navigateBack()
    },
    
    decreaseCount() {
      if (this.questionCount > 5) {
        this.questionCount -= 5
      }
    },
    
    increaseCount() {
      if (this.questionCount < 50) {
        this.questionCount += 5
      }
    },
    
    handleScopeChange(e) {
      this.testScope = e.detail.value
    },
    
    handleCategoryChange(e) {
      this.categoryIndex = e.detail.value
      this.selectedCategory = this.categories[this.categoryIndex]
    },
    
    startTest() {
      // 构建测验参数
      const params = {
        limit: this.questionCount,
        difficulty: this.selectedDifficulty
      }
      
      // 如果选择了分类，添加分类ID
      if (this.testScope === 'category' && this.selectedCategory) {
        params.category = this.selectedCategory.id
      }
      
      // 将参数序列化为URL查询字符串
      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&')
      
      // 导航到测验页面
      uni.navigateTo({
        url: `/pages/test/test.vue?${queryString}`
      })
    }
  }
}
</script>

<style lang="scss">
.container {
  padding: 30rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
  
  .header {
    display: flex;
    align-items: center;
    margin-bottom: 40rpx;
    
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
  
  .test-options {
    .option-card {
      background-color: #fff;
      border-radius: 16rpx;
      padding: 30rpx;
      margin-bottom: 20rpx;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
      
      .card-title {
        font-size: 30rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 20rpx;
      }
      
      .difficulty-options {
        display: flex;
        justify-content: space-between;
        
        .difficulty-item {
          width: 30%;
          height: 80rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f5f5f5;
          border-radius: 10rpx;
          font-size: 28rpx;
          color: #666;
          
          &.active {
            background-color: #3C8999;
            color: #fff;
          }
        }
      }
      
      .question-count {
        .count-control {
          display: flex;
          align-items: center;
          justify-content: center;
          
          .count-btn {
            width: 80rpx;
            height: 80rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f5f5f5;
            border-radius: 10rpx;
            font-size: 40rpx;
            color: #3C8999;
          }
          
          .count-value {
            width: 120rpx;
            text-align: center;
            font-size: 36rpx;
            font-weight: bold;
            margin: 0 20rpx;
          }
        }
      }
      
      .scope-selection {
        .scope-item {
          display: flex;
          align-items: center;
          margin-bottom: 20rpx;
          
          text {
            margin-left: 20rpx;
            font-size: 28rpx;
            color: #333;
          }
        }
      }
      
      .category-selection {
        margin-top: 20rpx;
        
        .category-picker {
          height: 80rpx;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #f5f5f5;
          border-radius: 10rpx;
          padding: 0 20rpx;
          font-size: 28rpx;
          color: #333;
        }
      }
    }
    
    .start-btn {
      height: 90rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(to right, #3C8999, #55a5b5);
      border-radius: 45rpx;
      color: #fff;
      font-size: 32rpx;
      font-weight: bold;
      margin-top: 40rpx;
      box-shadow: 0 6rpx 16rpx rgba(60, 137, 153, 0.3);
    }
  }
}
</style>