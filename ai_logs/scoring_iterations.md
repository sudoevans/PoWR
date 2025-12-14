# Scoring Formula Iterations

## Version 1.0 - Initial Formula

### Core Principles
- Weight merged work over raw commits
- Reward complexity & impact, not volume
- Penalize trivial or repetitive actions

### Formula (Per Skill)

```
PoW_skill = (
  ImpactScore × 0.4 +
  ComplexityDelta × 0.25 +
  CollaborationScore × 0.2 +
  ConsistencyScore × 0.15
)
```

### Component Definitions

**ImpactScore (0-100)**
- Based on PR acceptance rate
- Repo size and contributor count normalization
- OSS project participation bonus

**ComplexityDelta (0-100)**
- Code complexity changes (additions/deletions ratio)
- Refactoring depth
- Test presence bonus

**CollaborationScore (0-100)**
- PR reviews given/received
- Multi-author project participation
- Issue resolution rate

**ConsistencyScore (0-100)**
- Activity distribution over time window
- No streak bonuses (anti-gaming)
- Time-decay on inactive periods

### Anti-Gaming Measures

1. **Diminishing Returns**
   - Small commits (< 50 lines) get reduced weight
   - Trivial changes (whitespace, formatting only) are filtered

2. **Normalization**
   - Repo size normalization (large repos don't automatically score higher)
   - Contributor count normalization (solo projects vs team projects)

3. **Time Decay**
   - Older contributions (beyond 6 months) have reduced weight
   - Inactive periods reduce consistency score

4. **Quality Weighting**
   - Merged PRs > Open PRs > Commits
   - Reviewed PRs get bonus
   - Test coverage increases complexity score

### Future Iterations

- Version 1.1: Add language-specific skill detection
- Version 1.2: Incorporate code review feedback sentiment
- Version 2.0: Multi-platform support (GitLab, Bitbucket)

