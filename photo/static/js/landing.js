function carousel() {
    return {
      active: 0,
      slides: [
        {
          title: "Smart email campaign builder, made for Developers",
          subtitle: "Turn your visitors into profitable business with automation and analytics.",
          image: "https://cdn.rareblocks.xyz/collection/clarity/images/hero/2/illustration.png",
          bg: "carousel-bg-1",
          cta1: { text: "Get more customers", link: "#" },
          cta2: { text: "Watch free demo", link: "#" }
        },
        {
          title: "Personalized Campaigns, Real Results",
          subtitle: "Create, send, and track beautiful emails that convert.",
          image: "https://placehold.co/320x320/FFD600/fff?text=Personalized",
          bg: "carousel-bg-2",
          cta1: { text: "Start Free Trial", link: "#" },
          cta2: { text: "See Features", link: "#" }
        },
        {
          title: "Seamless Integrations & Security",
          subtitle: "Connect with your favorite tools and keep your data safe.",
          image: "https://placehold.co/320x320/A259FF/fff?text=Integrations",
          bg: "carousel-bg-3",
          cta1: { text: "Explore Integrations", link: "#" },
          cta2: { text: "Learn More", link: "#" }
        }
      ],
      interval: null,
      goTo(idx) {
        this.active = idx;
        this.restart();
      },
      next() {
        this.active = (this.active + 1) % this.slides.length;
        this.restart();
      },
      prev() {
        this.active = (this.active - 1 + this.slides.length) % this.slides.length;
        this.restart();
      },
      restart() {
        clearInterval(this.interval);
        this.auto();
      },
      auto() {
        this.interval = setInterval(() => {
          this.next();
        }, 6000);
      },
      init() {
        this.auto();
      }
    }
  }