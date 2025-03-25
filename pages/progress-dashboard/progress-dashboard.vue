<template>
  <view class="dashboard-container">
    <!-- 页面标题 -->
    <view class="dashboard-header">
      <view class="back-button" @tap="navigateBack">
        <text class="iconfont">&#xe679;</text>
      </view>
      <view class="page-title">学习进度</view>
    </view>
    
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-section">
      <view class="loader"></view>
      <text>加载中...</text>
    </view>
    
    <!-- 总体进度概览卡片 -->
    <view v-else class="progress-overview">
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-value">{{ progressData.totalSigns || 0 }}</text>
          <text class="stat-label">已学习</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ progressData.masteredSigns || 0 }}</text>
          <text class="stat-label">已掌握</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ formatTime(progressData.totalLearningTimeMinutes) }}</text>
          <text class="stat-label">学习时长</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ detailedStats.consecutiveLearningDays || 0 }}</text>
          <text class="stat-label">连续学习</text>
        </view>
      </view>
      
      <!-- 掌握等级分布 -->
      <view class="mastery-distribution">
        <view class="section-title">掌握等级分布</view>
        <view class="progress-bars">
          <view class="progress-item">
            <view class="progress-label">
              <text>未学习</text>
              <text>{{ calculatePercentage(progressData.notLearnedCount, totalVocabulary) }}%</text>
            </view>
            <view class="progress-bar-bg">
              <view 
                class="progress-bar-fill not-learned"
                :style="{ width: calculatePercentage(progressData.notLearnedCount, totalVocabulary) + '%' }"
              ></view>
            </view>
          </view>
          
          <view class="progress-item">
            <view class="progress-label">
              <text>未复习</text>
              <text>{{ calculatePercentage(progressData.notReviewedCount, totalVocabulary) }}%</text>
            </view>
            <view class="progress-bar-bg">
              <view 
                class="progress-bar-fill not-reviewed"
                :style="{ width: calculatePercentage(progressData.notReviewedCount, totalVocabulary) + '%' }"
              ></view>
            </view>
          </view>
          
          <view class="progress-item">
            <view class="progress-label">
              <text>已掌握</text>
              <text>{{ calculatePercentage(progressData.masteredSigns, totalVocabulary) }}%</text>
            </view>
            <view class="progress-bar-bg">
              <view 
                class="progress-bar-fill mastered"
                :style="{ width: calculatePercentage(progressData.masteredSigns, totalVocabulary) + '%' }"
              ></view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 平均熟练度 -->
      <view class="progress-bar-section">
        <view class="progress-label">
          <text>平均熟练度</text>
          <text>{{ formatProficiency(progressData.averageProficiency) }}</text>
        </view>
        <view class="progress-bar-bg">
          <view 
            class="progress-bar-fill"
            :style="{ width: progressData.averageProficiency + '%' }"
          ></view>
        </view>
      </view>
    </view>
    
    <!-- 学习时间统计 -->
    <view v-if="!loading" class="learning-timeline">
      <view class="section-header">
        <text class="section-title">本周学习频率</text>
      </view>
      <view class="timeline-chart">
        <!-- 学习频率图表 -->
        <view class="daily-activity">
          <view 
            v-for="(day, index) in weeklyLearningData" 
            :key="index"
            class="day-column"
          >
            <view 
              class="activity-bar"
              :style="{ height: calculateBarHeight(day.learningCount) + '%' }"
              :class="getActivityClass(day.learningCount)"
            ></view>
            <text class="day-label">{{ getDayLabel(day.dayOfWeek) }}</text>
          </view>
        </view>
        <text class="chart-note">学习次数统计</text>
      </view>
    </view>
    
    <!-- 技能掌握热图 -->
    <view v-if="!loading && categoryMasteryData.length > 0" class="skill-heatmap">
      <view class="section-header">
        <text class="section-title">分类掌握度</text>
      </view>
      <view class="heatmap-chart">
        <!-- 技能掌握热图 -->
        <view class="heatmap-container">
          <view 
            v-for="(category, index) in categoryMasteryData" 
            :key="index"
            class="heatmap-category"
          >
            <text class="category-name">{{ category.name }}</text>
            <view class="heatmap-cells">
              <view 
                v-for="(level, levelIndex) in 5" 
                :key="levelIndex"
                class="heatmap-cell"
                :class="getCellClass(category.proficiency, level)"
              ></view>
            </view>
          </view>
        </view>
        
        <view class="heatmap-legend">
          <view class="legend-item">
            <view class="legend-cell level-1"></view>
            <text>入门</text>
          </view>
          <view class="legend-item">
            <view class="legend-cell level-3"></view>
            <text>熟悉</text>
          </view>
          <view class="legend-item">
            <view class="legend-cell level-5"></view>
            <text>精通</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 继续学习建议 -->
    <view v-if="!loading && progressData.recommendedNextSigns && progressData.recommendedNextSigns.length > 0" class="continue-learning">
      <view class="section-header">
        <text class="section-title">学习建议</text>
      </view>
      <view class="recommendation-list">
        <view 
          v-for="(item, index) in progressData.recommendedNextSigns" 
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
            <view class="mastery-badge" :class="getMasteryBadgeClass(item.masteryLevel)">
              <text>{{ item.masteryLevel }}</text>
            </view>
          </view>
          <view class="start-btn">
            <text>开始</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 学习成就 -->
    <view v-if="!loading" class="achievements-section">
      <view class="section-header">
        <text class="section-title">学习成就</text>
      </view>
      <view class="achievements-list">
        <view class="achievement-item" :class="{'achievement-completed': detailedStats.consecutiveLearningDays >= 3}">
          <view class="achievement-icon" :class="{'icon-completed': detailedStats.consecutiveLearningDays >= 3}">
            <text class="iconfont">&#xe600;</text>
          </view>
          <view class="achievement-content">
            <text class="achievement-title">连续学习</text>
            <text class="achievement-desc">连续学习3天</text>
            <view class="achievement-progress-bar">
              <view class="achievement-progress-fill" :style="{width: Math.min(100, (detailedStats.consecutiveLearningDays / 3) * 100) + '%'}"></view>
            </view>
            <text class="achievement-progress-text">{{ detailedStats.consecutiveLearningDays || 0 }}/3天</text>
          </view>
        </view>
        
        <view class="achievement-item" :class="{'achievement-completed': progressData.masteredSigns >= 10}">
          <view class="achievement-icon" :class="{'icon-completed': progressData.masteredSigns >= 10}">
            <text class="iconfont">&#xe601;</text>
          </view>
          <view class="achievement-content">
            <text class="achievement-title">手语达人</text>
            <text class="achievement-desc">掌握10个手语</text>
            <view class="achievement-progress-bar">
              <view class="achievement-progress-fill" :style="{width: Math.min(100, (progressData.masteredSigns / 10) * 100) + '%'}"></view>
            </view>
            <text class="achievement-progress-text">{{ progressData.masteredSigns || 0 }}/10个</text>
          </view>
        </view>
        
        <view class="achievement-item" :class="{'achievement-completed': (progressData.totalLearningTimeMinutes || 0) >= 60}">
          <view class="achievement-icon" :class="{'icon-completed': (progressData.totalLearningTimeMinutes || 0) >= 60}">
            <text class="iconfont">&#xe602;</text>
          </view>
          <view class="achievement-content">
            <text class="achievement-title">学习专注</text>
            <text class="achievement-desc">累计学习1小时</text>
            <view class="achievement-progress-bar">
              <view class="achievement-progress-fill" :style="{width: Math.min(100, (progressData.totalLearningTimeMinutes / 60) * 100) + '%'}"></view>
            </view>
            <text class="achievement-progress-text">{{ formatTime(progressData.totalLearningTimeMinutes) }}/1小时</text>
          </view>
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
      progressData: {
        totalSigns: 0,
        notLearnedCount: 0,
        notReviewedCount: 0,
        masteredSigns: 0,
        averageProficiency: 0,
        totalLearningTimeMinutes: 0,
        recommendedNextSigns: []
      },
      detailedStats: {
        totalLearningDays: 0,
        consecutiveLearningDays: 0,
        firstLearningDate: null,
        lastLearningDate: null,
        weeklyLearningData: [],
        categoryMasteryMap: {}
      },
      weeklyLearningData: [],
      categoryMasteryData: [],
      // 假设的总词汇量，实际应从API获取或由后端计算
      totalVocabulary: 100
    }
  },
  
  onLoad() {
    this.checkLogin()
  },
  
  methods: {
    checkLogin() {
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
      
      this.loadProgressData()
      this.loadDetailedStats()
    },
    
    async loadProgressData() {
      this.loading = true
      
      try {
        const res = await http.get('/learning/statistics/progress')
        
        if (res.data.code === 0) {
          this.progressData = res.data.data
        } else {
          uni.showToast({
            title: '获取进度数据失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('加载进度数据失败:', error)
        // 使用模拟数据保证页面正常显示
        this.progressData = {
          totalSigns: 28,
          notLearnedCount: 60,
          notReviewedCount: 12,
          masteredSigns: 28,
          averageProficiency: 65.4,
          totalLearningTimeMinutes: 205,
          recommendedNextSigns: [
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
            }
          ]
        }
      } finally {
        this.loading = false
      }
    },
    
    async loadDetailedStats() {
      try {
        const res = await http.get('/learning/statistics/detailed')
        
        if (res.data.code === 0) {
          this.detailedStats = res.data.data
          
          // 处理周学习数据
          this.weeklyLearningData = this.detailedStats.weeklyLearningData || this.generateMockWeeklyData()
          
          // 处理分类掌握度数据
          this.processCategoryMasteryData()
        } else {
          this.weeklyLearningData = this.generateMockWeeklyData()
          this.generateMockCategoryData()
        }
      } catch (error) {
        console.error('加载详细统计数据失败:', error)
        this.weeklyLearningData = this.generateMockWeeklyData()
        this.generateMockCategoryData()
      }
    },
    
    processCategoryMasteryData() {
      const categoryMap = this.detailedStats.categoryMasteryMap || {}
      this.categoryMasteryData = Object.entries(categoryMap).map(([name, proficiency]) => ({
        name,
        proficiency
      }))
    },
    
    navigateBack() {
      uni.navigateBack()
    },
    
    formatTime(minutes) {
      if (!minutes) return '0h'
      
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      
      if (hours > 0) {
        return `${hours}h ${mins}m`
      }
      
      return `${mins}m`
    },
    
    formatProficiency(proficiency) {
      if (!proficiency) return '0%'
      return Math.round(proficiency) + '%'
    },
    
    calculatePercentage(value, total) {
      if (!total || !value) return 0
      return Math.round((value / total) * 100)
    },
    
    calculateBarHeight(count) {
      if (count === 0) return 0
      // 最小高度为20%，最大为100%
      return Math.min(100, Math.max(20, count * 20))
    },
    
    getCellClass(proficiency, level) {
      const normalizedLevel = proficiency / 100 * 5
      if (normalizedLevel >= level) {
        return `level-${level}`
      }
      return 'level-empty'
    },
    
    getActivityClass(value) {
      if (value === 0) return 'activity-none'
      if (value <= 1) return 'activity-low'
      if (value <= 3) return 'activity-medium'
      return 'activity-high'
    },
    
    getMasteryBadgeClass(masteryLevel) {
      if (masteryLevel === '未学习') return 'badge-not-learned'
      if (masteryLevel === '未复习') return 'badge-not-reviewed'
      return 'badge-mastered'
    },
    
    getDayLabel(dayOfWeek) {
      const days = ['一', '二', '三', '四', '五', '六', '日']
      return days[dayOfWeek - 1] || ''
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
        await http.post('/learning/statistics/record', {
          signId: signId
        })
      } catch (error) {
        console.error('记录学习行为失败:', error)
      }
    },
    
    // 生成模拟周数据
    generateMockWeeklyData() {
      return [
        { dayOfWeek: 1, learningCount: 2, learningMinutes: 20 },
        { dayOfWeek: 2, learningCount: 0, learningMinutes: 0 },
        { dayOfWeek: 3, learningCount: 1, learningMinutes: 10 },
        { dayOfWeek: 4, learningCount: 3, learningMinutes: 35 },
        { dayOfWeek: 5, learningCount: 4, learningMinutes: 45 },
        { dayOfWeek: 6, learningCount: 2, learningMinutes: 25 },
        { dayOfWeek: 7, learningCount: 1, learningMinutes: 15 }
      ]
    },
    
    // 生成模拟分类掌握度数据
    generateMockCategoryData() {
      this.categoryMasteryData = [
        { name: '日常用语', proficiency: 76.5 },
        { name: '数字', proficiency: 58.8 },
        { name: '颜色', proficiency: 42.5 },
        { name: '情感', proficiency: 25.2 },
        { name: '家庭', proficiency: 62.2 }
      ]
    }
  }
}
</script>

<style lang="scss">
.dashboard-container {
  padding: 30rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
  
  .dashboard-header {
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
    
    .page-title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      flex: 1;
    }
  }
  
  .loading-section {
    height: 300rpx;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
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
  }
  
  .section-header {
    margin-bottom: 20rpx;
    
    .section-title {
      font-size: 34rpx;
      font-weight: bold;
      color: #333;
    }
  }
  
  .progress-overview {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    
    .stats-grid {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 30rpx;
      
      .stat-item {
        width: 50%;
        padding: 15rpx 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .stat-value {
          font-size: 40rpx;
          font-weight: bold;
          color: #3C8999;
          margin-bottom: 8rpx;
        }
        
        .stat-label {
          font-size: 24rpx;
          color: #999;
        }
      }
    }
    
    .mastery-distribution {
      margin-bottom: 30rpx;
      
      .section-title {
        font-size: 30rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 15rpx;
      }
      
      .progress-bars {
        .progress-item {
          margin-bottom: 15rpx;
          
          .progress-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8rpx;
            
            text {
              font-size: 24rpx;
              color: #666;
            }
          }
          
          .progress-bar-bg {
            height: 16rpx;
            background-color: #f0f0f0;
            border-radius: 8rpx;
            overflow: hidden;
            
            .progress-bar-fill {
              height: 100%;
              border-radius: 8rpx;
              transition: width 0.5s;
              
              &.not-learned {
                background-color: #e0e0e0;
              }
              
              &.not-reviewed {
                background-color: #a6e1e8;
              }
              
              &.mastered {
                background-color: #3C8999;
              }
            }
          }
        }
      }
    }
    
    .progress-bar-section {
      .progress-label {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10rpx;
        
        text {
          font-size: 26rpx;
          color: #666;
        }
      }
      
      .progress-bar-bg {
        height: 20rpx;
        background-color: #f0f0f0;
        border-radius: 10rpx;
        overflow: hidden;
        
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(to right, #3C8999, #55a5b5);
          border-radius: 10rpx;
          transition: width 0.5s;
        }
      }
    }
  }
  
  .learning-timeline {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    
    .timeline-chart {
      .daily-activity {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        height: 200rpx;
        padding: 20rpx 0;
        
        .day-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 14%;
          
          .activity-bar {
            width: 40rpx;
            background-color: #d5f0f3;
            border-radius: 6rpx;
            transition: height 0.3s;
            
            &.activity-none {
              background-color: #f0f0f0;
            }
            
            &.activity-low {
              background-color: #d5f0f3;
            }
            
            &.activity-medium {
              background-color: #77c2cd;
            }
            
            &.activity-high {
              background-color: #3C8999;
            }
          }
          
          .day-label {
            font-size: 24rpx;
            color: #999;
            margin-top: 10rpx;
          }
        }
      }
      
      .chart-note {
        font-size: 24rpx;
        color: #999;
        text-align: center;
        margin-top: 20rpx;
        display: block;
      }
    }
  }
  
  .skill-heatmap {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    
    .heatmap-chart {
      .heatmap-container {
        margin-bottom: 20rpx;
        
        .heatmap-category {
          display: flex;
          align-items: center;
          margin-bottom: 15rpx;
          
          .category-name {
            width: 150rpx;
            font-size: 26rpx;
            color: #666;
            margin-right: 20rpx;
          }
          
          .heatmap-cells {
            flex: 1;
            display: flex;
            gap: 6rpx;
            
            .heatmap-cell {
              flex: 1;
              height: 30rpx;
              border-radius: 4rpx;
              background-color: #f0f0f0;
              
              &.level-1 {
                background-color: #d5f0f3;
              }
              
              &.level-2 {
                background-color: #a6e1e8;
              }
              
              &.level-3 {
                background-color: #77c2cd;
              }
              
              &.level-4 {
                background-color: #55a5b5;
              }
              
              &.level-5 {
                background-color: #3C8999;
              }
            }
          }
        }
      }
      
      .heatmap-legend {
        display: flex;
        justify-content: center;
        gap: 30rpx;
        
        .legend-item {
          display: flex;
          align-items: center;
          
          .legend-cell {
            width: 24rpx;
            height: 24rpx;
            border-radius: 4rpx;
            margin-right: 8rpx;
            
            &.level-1 {
              background-color: #d5f0f3;
            }
            
            &.level-3 {
              background-color: #77c2cd;
            }
            
            &.level-5 {
              background-color: #3C8999;
            }
          }
          
          text {
            font-size: 24rpx;
            color: #999;
          }
        }
      }
    }
  }
  
  .continue-learning {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    
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
          width: 80rpx;
          height: 80rpx;
          border-radius: 10rpx;
          margin-right: 20rpx;
          object-fit: cover;
        }
        
        .recommendation-info {
          flex: 1;
          
          .recommendation-name {
            font-size: 30rpx;
            color: #333;
            font-weight: 500;
            margin-bottom: 6rpx;
            display: block;
          }
          
          .recommendation-pinyin {
            font-size: 24rpx;
            color: #999;
            display: block;
            margin-bottom: 8rpx;
          }
          
          .mastery-badge {
            display: inline-block;
            padding: 4rpx 16rpx;
            border-radius: 20rpx;
            font-size: 22rpx;
            
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
        
        .start-btn {
          background-color: #3C8999;
          border-radius: 30rpx;
          padding: 10rpx 30rpx;
          
          text {
            font-size: 26rpx;
            color: #fff;
          }
        }
      }
    }
  }
  
  .achievements-section {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    
    .achievements-list {
      .achievement-item {
        display: flex;
        align-items: center;
        padding: 20rpx 0;
        border-bottom: 1px solid #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        &.achievement-completed {
          background-color: rgba(60, 137, 153, 0.05);
        }
        
        .achievement-icon {
          width: 80rpx;
          height: 80rpx;
          border-radius: 50%;
          background-color: #f5f5f5;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-right: 20rpx;
          
          .iconfont {
            font-size: 40rpx;
            color: #999;
          }
          
          &.icon-completed {
            background-color: #3C8999;
            
            .iconfont {
              color: #fff;
            }
          }
        }
        
        .achievement-content {
          flex: 1;
          
          .achievement-title {
            font-size: 30rpx;
            color: #333;
            font-weight: 500;
            margin-bottom: 6rpx;
          }
          
          .achievement-desc {
            font-size: 24rpx;
            color: #999;
            margin-bottom: 12rpx;
          }
          
          .achievement-progress-bar {
            height: 16rpx;
            background-color: #f0f0f0;
            border-radius: 8rpx;
            overflow: hidden;
            margin-bottom: 8rpx;
            
            .achievement-progress-fill {
              height: 100%;
              background-color: #3C8999;
              border-radius: 8rpx;
              transition: width 0.5s;
            }
          }
          
          .achievement-progress-text {
            font-size: 22rpx;
            color: #999;
          }
        }
      }
    }
  }
}