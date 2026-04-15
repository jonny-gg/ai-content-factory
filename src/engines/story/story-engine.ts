import type {
  CharacterProfile,
  ScenePurpose,
  StoryGenerationOptions,
  StoryPackage,
  StoryScene,
  SupportedPlatform,
} from '../../core/types';

const DEFAULT_PLATFORM: SupportedPlatform = 'douyin';

const PURPOSES: ScenePurpose[] = ['hook', 'setup', 'conflict', 'twist', 'payoff', 'cta'];

function inferGenre(topic: string, style?: string): string {
  if (style?.trim()) return style.trim();
  if (/[逆袭|翻身|暴富|赚钱]/.test(topic)) return 'money-drama';
  if (/[程序员|AI|副业]/.test(topic)) return 'growth-story';
  return 'short-drama';
}

function normalizeSceneCount(sceneCount?: number): number {
  if (!sceneCount || sceneCount < 4) return 6;
  return Math.min(sceneCount, 8);
}

function splitDuration(totalDurationSec: number, sceneCount: number): number[] {
  const base = Math.floor(totalDurationSec / sceneCount);
  const durations = new Array(sceneCount).fill(base);
  let remainder = totalDurationSec - base * sceneCount;

  let index = 0;
  while (remainder > 0) {
    durations[index] += 1;
    remainder -= 1;
    index = (index + 1) % sceneCount;
  }

  return durations;
}

function buildCharacters(topic: string): CharacterProfile[] {
  return [
    {
      id: 'lead',
      name: '主角',
      role: '想靠 AI 副业翻身的人',
      voice: 'confident-neutral',
      visualStyle: `真实感短视频主角，围绕主题：${topic}`,
      personality: ['务实', '焦虑', '执行力强']
    },
    {
      id: 'mentor',
      name: '对照角色',
      role: '点破关键认知的人',
      voice: 'calm-advisor',
      visualStyle: '成熟、理性、可信赖',
      personality: ['冷静', '直接', '结果导向']
    }
  ];
}

function buildPurpose(index: number, sceneCount: number): ScenePurpose {
  if (index < PURPOSES.length) return PURPOSES[index];
  if (index === sceneCount - 1) return 'cta';
  return 'payoff';
}

function buildScenes(options: StoryGenerationOptions, hook: string, cta: string): StoryScene[] {
  const sceneCount = normalizeSceneCount(options.sceneCount);
  const totalDurationSec = options.targetDurationSec ?? 45;
  const durations = splitDuration(totalDurationSec, sceneCount);

  return durations.map((durationSec, index) => {
    const order = index + 1;
    const purpose = buildPurpose(index, sceneCount);
    const subtitle = buildSubtitle(order, purpose, options.topic, hook, cta);

    return {
      sceneId: `scene-${order}`,
      order,
      durationSec,
      purpose,
      narration: buildNarration(order, purpose, options.topic, hook, cta),
      dialogue: buildDialogue(order, purpose, options.topic),
      subtitle,
      visualPrompt: buildVisualPrompt(order, purpose, options.topic),
      camera: buildCamera(order, purpose),
      transition: order === sceneCount ? 'fade-out' : 'hard-cut'
    };
  });
}

function buildSubtitle(order: number, purpose: ScenePurpose, topic: string, hook: string, cta: string): string {
  switch (purpose) {
    case 'hook':
      return hook;
    case 'setup':
      return `主角盯着 ${topic}，发现问题根本不是不会做，而是不会选高价值切口。`;
    case 'conflict':
      return '他连做了几个低客单项目，忙得要死，却几乎赚不到钱。';
    case 'twist':
      return '真正的转折点不是更努力，而是把 AI 当放大器，只做能直接变现的事。';
    case 'payoff':
      return '他把同样 2 小时投入到高客单价方案后，第一次看到可复制的现金流。';
    case 'cta':
      return cta;
    default:
      return `${order}. ${topic}`;
  }
}

function buildNarration(order: number, purpose: ScenePurpose, topic: string, hook: string, cta: string): string {
  switch (purpose) {
    case 'hook':
      return hook;
    case 'setup':
      return `他本来以为 ${topic} 只要会做内容就行，后来才发现，决定结果的其实是选题和变现结构。`;
    case 'conflict':
      return '最危险的陷阱，是用最宝贵的时间，去做最便宜、最难成交的项目。';
    case 'twist':
      return '当他开始反过来思考：先想谁会付钱，再决定做什么内容，整个剧本都变了。';
    case 'payoff':
      return '同样是发内容，这次每一步都在为成交铺路，不再只是堆播放量。';
    case 'cta':
      return cta;
    default:
      return `${order}. ${topic}`;
  }
}

function buildDialogue(order: number, purpose: ScenePurpose, topic: string) {
  switch (purpose) {
    case 'hook':
      return [{ characterId: 'lead', text: `为什么同样做 ${topic}，有人赚钱，有人只是在自我感动？`, emotion: 'urgent' }];
    case 'setup':
      return [{ characterId: 'lead', text: '我以为缺的是执行，后来发现缺的是方向。', emotion: 'reflective' }];
    case 'conflict':
      return [{ characterId: 'lead', text: '项目做了很多，但每个都又累又不值钱。', emotion: 'frustrated' }];
    case 'twist':
      return [{ characterId: 'mentor', text: '别再先做再想怎么卖，先找到愿意付钱的人。', emotion: 'calm' }];
    case 'payoff':
      return [{ characterId: 'lead', text: '原来不是我不行，是我之前一直在做错题。', emotion: 'relieved' }];
    case 'cta':
      return [{ characterId: 'mentor', text: '想要我把这套高变现路径拆给你，评论区留“副业”。', emotion: 'direct' }];
    default:
      return [{ characterId: 'lead', text: `${topic}`, emotion: 'neutral' }];
  }
}

function buildVisualPrompt(order: number, purpose: ScenePurpose, topic: string): string {
  const common = '9:16 vertical frame, cinematic realism, Chinese short-video style, strong facial emotion, clean composition';

  switch (purpose) {
    case 'hook':
      return `${common}, close-up of a stressed young creator staring at earnings dashboard, theme: ${topic}, high tension lighting`;
    case 'setup':
      return `${common}, desk scene with laptop, notes, AI tools on screen, creator planning monetization path for ${topic}`;
    case 'conflict':
      return `${common}, cluttered workspace, exhausted creator surrounded by failed low-ticket project ideas, dramatic contrast`;
    case 'twist':
      return `${common}, mentor figure pointing at a simple profitable funnel on whiteboard, breakthrough moment`;
    case 'payoff':
      return `${common}, creator sees first meaningful revenue results, focused optimism, dashboard glow`;
    case 'cta':
      return `${common}, strong direct-to-camera pose, persuasive final frame, social CTA overlay energy`;
    default:
      return `${common}, scene ${order}, topic ${topic}`;
  }
}

function buildCamera(order: number, purpose: ScenePurpose): string {
  switch (purpose) {
    case 'hook':
      return 'extreme-close-up';
    case 'setup':
      return 'medium-shot';
    case 'conflict':
      return 'handheld-medium';
    case 'twist':
      return 'push-in';
    case 'payoff':
      return 'slow-dolly';
    case 'cta':
      return 'direct-to-camera';
    default:
      return order % 2 === 0 ? 'medium-shot' : 'close-up';
  }
}

export class StoryEngine {
  async generateStory(options: StoryGenerationOptions): Promise<StoryPackage> {
    const platform = options.platform ?? DEFAULT_PLATFORM;
    const genre = inferGenre(options.topic, options.style);
    const language = options.language ?? 'zh-CN';
    const hook = `一个普通人做 ${options.topic}，如果前 7 天还没看到变现信号，大概率方向就错了。`;
    const cta = '想拿这类高变现 AI 副业题材的完整落地模板，评论区或私信我“副业”。';
    const characters = buildCharacters(options.topic);
    const scenes = buildScenes(options, hook, cta);

    return {
      id: `story-${Date.now()}`,
      createdAt: new Date().toISOString(),
      platform,
      niche: options.niche ?? 'AI副业',
      topic: options.topic,
      genre,
      language,
      title: `${options.topic}：普通人也能复制的高变现短视频脚本`,
      hook,
      summary: `围绕 ${options.topic}，用短剧化方式讲清楚从低价值忙碌到高价值变现的转折过程。`,
      cta,
      characters,
      scenes,
      publish: {
        titleOptions: [
          `${options.topic}，不是不会做，是你做错了`,
          `做 ${options.topic} 的人，90% 死在这一步`,
          `${options.topic} 想赚钱，先别急着开干`
        ],
        caption: `这条内容拆的是 ${options.topic} 背后的真实变现逻辑。别再盲目卷执行，先把高价值路径走对。`,
        hashtags: ['#AI副业', '#副业赚钱', '#短视频变现', '#程序员副业', '#普通人创业'],
        coverText: '先找钱，再干活'
      },
      metricsTarget: {
        targetWatchRate: 0.45,
        targetCompletionRate: 0.28,
        targetClickThroughRate: 0.05,
        monetizationGoal: '吸引对 AI 副业感兴趣的精准咨询'
      }
    };
  }
}
