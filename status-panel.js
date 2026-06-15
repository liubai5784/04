(() => {
  const STORAGE_KEY = "liubai-personal-status-panel-v2";
  const HISTORY_KEY = "liubai-personal-status-history-v2";
  const HISTORY_LIMIT = 14;

  const headlines = [
    "半清醒但还能动",
    "表面冷静，内心加载中",
    "摸鱼欲望正在蓄力",
    "打开文档前的最后准备",
    "精神状态：勉强在线",
    "今天适合慢慢推进",
    "DDL 雷达轻微报警",
    "灵感信号断断续续",
    "学习系统正在预热",
    "今天有一点点能量",
    "大脑进入省电模式",
    "行动力正在缓慢开机",
    "计划很多，先做一个",
    "适合低速稳定前进",
    "今日主线任务未解锁",
    "小步推进模式启动",
    "正在从摸鱼态切换中",
    "今天先别和完美较劲",
    "文件已经在召唤你了",
    "状态一般，但还能抢救",
    "拖延系统轻微活跃",
    "灵感路过，建议抓住",
    "今日适合先完成小事",
    "精神电量正在回升",
    "进入温和努力模式",
    "临时爆发概率上升",
    "理智在线，手速待机",
    "先启动，再优化",
    "看起来想休息，其实还能写",
    "今日适合把坑填一点"
  ];

  const summaries = [
    "系统检测到你还没有完全启动，但只要先点开一个页面，就已经比刚才更接近完成了。",
    "当前状态适合做一点不太难的小事：整理目录、改标题、打开文件、写第一行。",
    "今日建议先不要追求完美，先让东西动起来，后面再慢慢修。",
    "如果不想开始，就把任务拆到小到离谱：先做五分钟也算推进。",
    "适合先完成一个最容易的入口任务，给自己一点正反馈。",
    "今天不适合硬刚大任务，适合把大任务切成几个很小的入口。",
    "脑袋还没完全清醒，但手可以先动，等思路在路上追上来。",
    "适合处理那些一直拖着的小尾巴，解决一个就会轻松一点。",
    "今天的关键词是低门槛启动：打开、保存、写一句，先别想太远。",
    "不要等状态完美再开始，状态很多时候是开始之后才慢慢来的。",
    "如果现在很乱，就先列三件事，然后只选最容易的一件做。",
    "适合先把页面、文档或文件夹摆好，给后面的自己铺一条路。",
    "今天可以慢，但最好不要完全停机，哪怕只推进一点点也算数。",
    "先避开最让人头大的部分，从能立刻完成的小块开始回血。",
    "系统建议减少思考内耗，直接进入一个可执行动作。",
    "今天不一定要做很多，但可以做得比完全不动多一点。",
    "适合用十分钟换一个明确进度，不要用半小时纠结怎么开始。",
    "你的状态像刚开机的电脑，先让程序跑起来，速度之后会回来。",
    "如果有任务压着，就先做一个能截图交差的半成品。",
    "今日适合轻度整理、局部修补和一点点推进，不适合自我审判。",
    "把最难的目标改成一个最小动作，完成之后再决定要不要继续。",
    "不要让待办清单吓你，今天只需要抓住下一步。",
    "如果想摸鱼，就先做一点再摸，这样摸起来会更安心。",
    "今天的你不需要突然很强，只需要比刚才多前进一格。",
    "适合把脑子里的想法先倒出来，丑一点也没关系。",
    "今日精神状态适合边做边想，不适合坐着等灵感。",
    "先把页面打开，先把标题写上，先让任务拥有一个开始。",
    "系统建议今日采用温和推进路线：少骂自己，多留存档。",
    "可以允许自己慢一点，但别把开始按钮藏起来。",
    "今天最划算的操作是：先完成一个十分钟以内的小任务。"
  ];

  const skills = [
    "临时抱佛脚",
    "五分钟启动术",
    "复制粘贴整理术",
    "DDL 前夜爆发",
    "截图找灵感",
    "先开文档再说",
    "把复杂事改成小步骤",
    "低速稳定推进",
    "半成品保存术",
    "标题先行法",
    "假装已经开始",
    "快速列清单",
    "先做简单题",
    "边摸鱼边恢复",
    "草稿护体",
    "拖延反杀",
    "十分钟冲刺",
    "灵感捕捉",
    "页面修补术",
    "一键进入学习态",
    "作业拆块术",
    "收藏夹翻找术",
    "先交再改",
    "小步快跑",
    "突然清醒三分钟",
    "复用旧模板",
    "把坑标出来",
    "晚上效率玄学",
    "保存即胜利",
    "把难题放小"
  ];

  const debuffs = [
    "打开文档困难",
    "手机吸引力增强",
    "脑袋缓存不足",
    "想法很多但手不动",
    "困意随机刷新",
    "选择困难加重",
    "刚坐下就想休息",
    "网页越开越多",
    "计划写得比任务多",
    "灵感延迟到账",
    "注意力轻微漏风",
    "保存后忘记下一步",
    "桌面文件夹混乱",
    "突然想整理别的东西",
    "学习前摇过长",
    "大脑自动播放杂念",
    "进度条看起来不动",
    "消息提示干扰",
    "完美主义偷袭",
    "困但不想睡",
    "想先喝口水再说",
    "打开网页后忘了目的",
    "越急越想摸鱼",
    "临时搜索欲增强",
    "任务边界模糊",
    "状态栏显示未知错误",
    "坐姿加载失败",
    "文件命名困难",
    "脑内弹窗过多",
    "开始按钮有点远"
  ];

  const advice = [
    "先做五分钟，剩下的交给惯性。",
    "先把最容易的一项完成，不要从最难的开始。",
    "把任务写成三条以内，今天只盯着下一步。",
    "先保存一个很粗糙的版本，完美以后再说。",
    "喝口水，坐回来，打开文件，写一行。",
    "今天可以慢一点，但不要完全停住。",
    "先做一个能立刻看见结果的小动作。",
    "把大任务改成：打开文件、写标题、补一句。",
    "先别优化，先让它存在。",
    "给自己十分钟，十分钟后再决定要不要继续。",
    "不要从最痛苦的地方开始，从最顺手的地方切进去。",
    "如果不知道做什么，就先整理当前页面。",
    "先写一个丑版本，明天的你会感谢今天的存档。",
    "先把能复制的模板找出来，再慢慢填。",
    "任务太大时，只做入口，不做全程。",
    "把手机放远一点，给自己一个启动窗口。",
    "今天只要求推进，不要求惊艳。",
    "做完一个小块就截图存档，制造一点完成感。",
    "把脑子里的想法先扔到纸上，不用排序。",
    "先完成最容易交差的部分，再处理细节。",
    "打开文档后不要立刻美化，先写内容。",
    "先清掉一个两分钟能完成的小任务。",
    "卡住的时候换成复述题目，不要空坐着。",
    "如果想休息，先做一个小动作再休息。",
    "把今天的目标降到现实能做到的大小。",
    "遇到难题先标记，不要让它堵住全部进度。",
    "先写目录也算开始，别小看目录。",
    "不要一直准备，准备十分钟后必须动手。",
    "今天适合稳，不适合猛。",
    "完成比好看重要，先让它能跑起来。"
  ];

  const meterRanges = {
    energy: [24, 92],
    study: [16, 90],
    slack: [22, 96],
    ddl: [18, 98]
  };

  function hashString(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function createRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value += 0x6D2B79F5;
      let result = value;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(list, random) {
    return list[Math.floor(random() * list.length)];
  }

  function makeMeter(random, name) {
    const [min, max] = meterRanges[name];
    const raw = Math.round(min + random() * (max - min));
    return Math.max(min, Math.min(max, raw));
  }

  function getTodayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getDisplayDate() {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long"
    }).format(new Date());
  }

  function getStatusSignature(status) {
    return [status.headline, status.summary, status.skill, status.debuff, status.advice].join("|");
  }

  function makeStatus(seedText, salt = 0) {
    const random = createRandom(hashString(`${seedText}|${salt}|daily-status-panel`));
    const status = {
      headline: pick(headlines, random),
      summary: pick(summaries, random),
      skill: pick(skills, random),
      debuff: pick(debuffs, random),
      advice: pick(advice, random),
      meters: {
        energy: makeMeter(random, "energy"),
        study: makeMeter(random, "study"),
        slack: makeMeter(random, "slack"),
        ddl: makeMeter(random, "ddl")
      }
    };

    status.signature = getStatusSignature(status);
    return status;
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn("读取个人状态面板数据失败：", error);
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn("保存个人状态面板数据失败：", error);
    }
  }

  function readStoredStatus(todayKey) {
    const saved = readJson(STORAGE_KEY, null);
    return saved?.date === todayKey ? saved.status : null;
  }

  function readHistory() {
    const history = readJson(HISTORY_KEY, []);
    return Array.isArray(history) ? history : [];
  }

  function rememberStatus(todayKey, status) {
    const history = readHistory()
      .filter((item) => item?.date !== todayKey)
      .slice(0, HISTORY_LIMIT - 1);

    history.unshift({
      date: todayKey,
      signature: status.signature
    });

    writeJson(HISTORY_KEY, history);
  }

  function createDailyStatus(todayKey) {
    const history = readHistory();
    const recentSignatures = new Set(history.map((item) => item?.signature).filter(Boolean));

    for (let salt = 0; salt < 100; salt += 1) {
      const status = makeStatus(todayKey, salt);
      if (!recentSignatures.has(status.signature)) return status;
    }

    return makeStatus(todayKey, 101);
  }

  function saveStatus(todayKey, status) {
    writeJson(STORAGE_KEY, {
      date: todayKey,
      version: 2,
      status
    });
    rememberStatus(todayKey, status);
  }

  function setText(selector, text) {
    const element = document.querySelector(selector);
    if (element) element.textContent = text;
  }

  function renderMeter(name, value) {
    const meter = document.querySelector(`[data-status-meter="${name}"]`);
    if (!meter) return;
    const number = meter.querySelector("strong");
    const bar = meter.querySelector(".meter-track span");
    if (number) number.textContent = `${value}%`;
    if (bar) bar.style.width = `${value}%`;
  }

  function renderStatus(status) {
    setText("#statusHeadline", status.headline);
    setText("#statusSummary", status.summary);
    setText("#statusSkill", status.skill);
    setText("#statusDebuff", status.debuff);
    setText("#statusAdvice", status.advice);
    setText("#statusDate", `${getDisplayDate()} · 今日状态已固定，明天自动刷新`);

    Object.entries(status.meters).forEach(([name, value]) => renderMeter(name, value));
  }

  function initStatusPanel() {
    const panel = document.querySelector("#status-panel");
    if (!panel) return;

    const todayKey = getTodayKey();
    const initialStatus = readStoredStatus(todayKey) || createDailyStatus(todayKey);
    saveStatus(todayKey, initialStatus);
    renderStatus(initialStatus);

    document.querySelector("#refreshStatus")?.addEventListener("click", () => {
      const status = readStoredStatus(todayKey) || initialStatus;
      renderStatus(status);
      setText("#statusDate", `${getDisplayDate()} · 今天已经生成过啦，明天再换一套`);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStatusPanel);
  } else {
    initStatusPanel();
  }
})();