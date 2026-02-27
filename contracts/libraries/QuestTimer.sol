// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title QuestTimer
 * @author Quest Mini Team
 * @notice Library for managing quest timing mechanics including cooldowns, windows, and expiry
 * @dev Provides gas-efficient time-based utilities for quest management
 */
library QuestTimer {
    
    /// @notice Time constants for common durations
    uint256 constant MINUTE = 60;
    uint256 constant HOUR = 60 * MINUTE;
    uint256 constant DAY = 24 * HOUR;
    uint256 constant WEEK = 7 * DAY;
    uint256 constant MONTH = 30 * DAY;
    
    /// @notice Struct for time-bounded quests
    struct TimeWindow {
        uint256 startTime;
        uint256 endTime;
    }
    
    /// @notice Struct for tracking user cooldowns
    struct Cooldown {
        uint256 lastAction;
        uint256 duration;
    }
    
    /// @notice Struct for recurring time slots (e.g., daily reset at midnight)
    struct RecurringSlot {
        uint256 intervalDuration;
        uint256 offsetFromEpoch;
    }
    
    // ============ Time Window Functions ============
    
    /**
     * @notice Check if current time is within a time window
     * @param window The time window to check against
     * @return isActive True if current block timestamp is within window
     */
    function isWindowActive(TimeWindow memory window) internal view returns (bool isActive) {
        return block.timestamp >= window.startTime && block.timestamp <= window.endTime;
    }
    
    /**
     * @notice Create a time window starting now with specified duration
     * @param duration Length of the window in seconds
     * @return window The created time window
     */
    function createWindow(uint256 duration) internal view returns (TimeWindow memory window) {
        window.startTime = block.timestamp;
        window.endTime = block.timestamp + duration;
    }
    
    /**
     * @notice Get remaining time in a window
     * @param window The time window
     * @return remaining Seconds remaining (0 if expired)
     */
    function remainingTime(TimeWindow memory window) internal view returns (uint256 remaining) {
        if (block.timestamp >= window.endTime) {
            return 0;
        }
        return window.endTime - block.timestamp;
    }
    
    /**
     * @notice Check if a window has expired
     * @param window The time window
     * @return expired True if window has ended
     */
    function hasExpired(TimeWindow memory window) internal view returns (bool expired) {
        return block.timestamp > window.endTime;
    }
    
    /**
     * @notice Check if a window hasn't started yet
     * @param window The time window
     * @return pending True if window hasn't started
     */
    function isPending(TimeWindow memory window) internal view returns (bool pending) {
        return block.timestamp < window.startTime;
    }
    
    // ============ Cooldown Functions ============
    
    /**
     * @notice Check if a cooldown has elapsed
     * @param cooldown The cooldown to check
     * @return ready True if cooldown period has passed
     */
    function isReady(Cooldown memory cooldown) internal view returns (bool ready) {
        // First action is always allowed
        if (cooldown.lastAction == 0) {
            return true;
        }
        return block.timestamp >= cooldown.lastAction + cooldown.duration;
    }
    
    /**
     * @notice Get remaining cooldown time
     * @param cooldown The cooldown to check
     * @return remaining Seconds until cooldown ends (0 if ready)
     */
    function cooldownRemaining(Cooldown memory cooldown) internal view returns (uint256 remaining) {
        if (cooldown.lastAction == 0) {
            return 0;
        }
        
        uint256 readyTime = cooldown.lastAction + cooldown.duration;
        if (block.timestamp >= readyTime) {
            return 0;
        }
        return readyTime - block.timestamp;
    }
    
    /**
     * @notice Reset a cooldown to start now
     * @param cooldown The cooldown to reset
     * @return updated The updated cooldown
     */
    function reset(Cooldown memory cooldown) internal view returns (Cooldown memory updated) {
        updated.lastAction = block.timestamp;
        updated.duration = cooldown.duration;
    }
    
    /**
     * @notice Calculate percentage of cooldown elapsed
     * @param cooldown The cooldown to check
     * @return percentage Percentage elapsed (0-100)
     */
    function elapsedPercentage(Cooldown memory cooldown) internal view returns (uint256 percentage) {
        if (cooldown.lastAction == 0 || cooldown.duration == 0) {
            return 100;
        }
        
        uint256 elapsed = block.timestamp - cooldown.lastAction;
        if (elapsed >= cooldown.duration) {
            return 100;
        }
        
        return (elapsed * 100) / cooldown.duration;
    }
    
    // ============ Recurring Slot Functions ============
    
    /**
     * @notice Get the current slot number for a recurring event
     * @param slot The recurring slot configuration
     * @return slotNumber The current slot (period) number
     */
    function getCurrentSlot(RecurringSlot memory slot) internal view returns (uint256 slotNumber) {
        uint256 adjustedTime = block.timestamp - slot.offsetFromEpoch;
        return adjustedTime / slot.intervalDuration;
    }
    
    /**
     * @notice Get the start time of the current slot
     * @param slot The recurring slot configuration
     * @return startTime Unix timestamp of slot start
     */
    function currentSlotStart(RecurringSlot memory slot) internal view returns (uint256 startTime) {
        uint256 slotNumber = getCurrentSlot(slot);
        return (slotNumber * slot.intervalDuration) + slot.offsetFromEpoch;
    }
    
    /**
     * @notice Get time until next slot begins
     * @param slot The recurring slot configuration
     * @return timeUntil Seconds until next slot
     */
    function timeUntilNextSlot(RecurringSlot memory slot) internal view returns (uint256 timeUntil) {
        uint256 nextSlotStart = currentSlotStart(slot) + slot.intervalDuration;
        return nextSlotStart - block.timestamp;
    }
    
    /**
     * @notice Check if an action timestamp is in the current slot
     * @param slot The recurring slot configuration
     * @param actionTime The timestamp to check
     * @return inSlot True if action is in current slot
     */
    function isInCurrentSlot(RecurringSlot memory slot, uint256 actionTime) internal view returns (bool inSlot) {
        uint256 currentSlotNum = getCurrentSlot(slot);
        uint256 actionSlotNum = (actionTime - slot.offsetFromEpoch) / slot.intervalDuration;
        return currentSlotNum == actionSlotNum;
    }
    
    // ============ Daily Quest Helpers ============
    
    /**
     * @notice Get the start of today (00:00 UTC)
     * @return todayStart Unix timestamp of today's start
     */
    function getTodayStart() internal view returns (uint256 todayStart) {
        return (block.timestamp / DAY) * DAY;
    }
    
    /**
     * @notice Check if a timestamp is from today
     * @param timestamp The timestamp to check
     * @return isToday True if timestamp is from today
     */
    function isSameDay(uint256 timestamp) internal view returns (bool isToday) {
        return (timestamp / DAY) == (block.timestamp / DAY);
    }
    
    /**
     * @notice Check if a timestamp is from yesterday
     * @param timestamp The timestamp to check
     * @return isYesterday True if timestamp is from yesterday
     */
    function isYesterday(uint256 timestamp) internal view returns (bool isYesterday) {
        uint256 today = block.timestamp / DAY;
        uint256 targetDay = timestamp / DAY;
        return today == targetDay + 1;
    }
    
    /**
     * @notice Calculate days between two timestamps
     * @param startTimestamp Earlier timestamp
     * @param endTimestamp Later timestamp
     * @return daysDifference Number of days
     */
    function daysBetween(uint256 startTimestamp, uint256 endTimestamp) internal pure returns (uint256 daysDifference) {
        if (endTimestamp <= startTimestamp) {
            return 0;
        }
        return (endTimestamp - startTimestamp) / DAY;
    }
    
    /**
     * @notice Get the week number since epoch
     * @param timestamp The timestamp to check
     * @return weekNumber Week number (0-indexed)
     */
    function getWeekNumber(uint256 timestamp) internal pure returns (uint256 weekNumber) {
        return timestamp / WEEK;
    }
    
    /**
     * @notice Check if a timestamp is from the same week
     * @param timestamp The timestamp to check
     * @return isSameWeek True if same week as now
     */
    function isSameWeek(uint256 timestamp) internal view returns (bool) {
        return getWeekNumber(timestamp) == getWeekNumber(block.timestamp);
    }
    
    // ============ Streak Helper Functions ============
    
    /**
     * @notice Check if streak should continue based on last completion
     * @param lastCompletion Timestamp of last completion
     * @return shouldContinue True if within streak window (yesterday)
     */
    function isStreakValid(uint256 lastCompletion) internal view returns (bool shouldContinue) {
        if (lastCompletion == 0) {
            return true; // First completion starts a streak
        }
        
        // Check if last completion was yesterday (maintains streak)
        // or earlier today (same day, streak already counted)
        return isSameDay(lastCompletion) || isYesterday(lastCompletion);
    }
    
    /**
     * @notice Calculate streak grace period end time
     * @param lastCompletion Last completion timestamp
     * @param gracePeriod Additional grace in seconds
     * @return deadline Timestamp when streak expires
     */
    function streakDeadline(uint256 lastCompletion, uint256 gracePeriod) internal pure returns (uint256 deadline) {
        uint256 nextDayEnd = ((lastCompletion / DAY) + 2) * DAY;
        return nextDayEnd + gracePeriod;
    }
}
