import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Upload,
  Brain,
  Zap,
  CheckCircle,
  Star,
  ArrowRight,
  Shield,
  Clock,
  Users,
  Target,
  BarChart3,
  Globe,
  Smartphone,
  ChevronDown,
  Menu,
  X
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms analyze your images to generate SEO-optimized alt text"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Process hundreds of images in minutes with our optimized AI processing pipeline"
    },
    {
      icon: Target,
      title: "SEO Optimized",
      description: "Generate alt text that improves your search rankings and accessibility compliance"
    },
    {
      icon: Shield,
      title: "ADA Compliant",
      description: "Ensure your website meets accessibility standards with detailed alt text descriptions"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track your progress with detailed analytics and performance metrics"
    },
    {
      icon: Globe,
      title: "Multi-Platform",
      description: "Export alt text for Shopify, WooCommerce, and other e-commerce platforms"
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for trying out AltTextAI",
      features: [
        "50 images per month",
        "Basic alt text generation",
        "Standard support",
        "Export to CSV"
      ],
      buttonText: "Get Started",
      popular: false
    },
    {
      name: "Pro",
      price: "$19.99",
      period: "per month",
      description: "For small businesses and freelancers",
      features: [
        "500 images per month",
        "Advanced AI analysis",
        "Priority support",
        "Bulk processing",
        "API access",
        "Custom branding"
      ],
      buttonText: "Start Pro Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "$99.99",
      period: "per month",
      description: "For large teams and agencies",
      features: [
        "5000 images per month",
        "Everything in Pro",
        "Dedicated support",
        "Custom integrations",
        "White-label options",
        "Advanced analytics"
      ],
      buttonText: "Contact Sales",
      popular: false
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "E-commerce Manager",
      company: "FashionForward",
      content: "AltTextAI has transformed our product image optimization. We've seen a 40% improvement in our SEO rankings.",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Digital Marketing Director",
      company: "TechStore",
      content: "The AI accuracy is incredible. It understands context better than our previous manual process.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Accessibility Specialist",
      company: "InclusiveWeb",
      content: "Finally, a tool that makes ADA compliance easy and effective. Our users love the detailed descriptions.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Sparkles className="w-8 h-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-slate-900">AltTextAI</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</a>
              <Link to="/pricing" className="text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link>
              <a href="#about" className="text-slate-600 hover:text-slate-900 transition-colors">About</a>
              <Button variant="outline" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/register')}>
                Get Started
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200/60 py-4">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</a>
                <Link to="/pricing" className="text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link>
                <a href="#about" className="text-slate-600 hover:text-slate-900 transition-colors">About</a>
                <Button variant="outline" onClick={() => navigate('/login')} className="w-full">
                  Sign In
                </Button>
                <Button onClick={() => navigate('/register')} className="w-full">
                  Get Started
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              AI-Powered SEO Optimization
            </Badge>
          </div>

          <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6">
            Transform Your E-commerce
            <span className="text-blue-600"> SEO</span> with AI
          </h1>

          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
            Generate SEO-optimized alt text for your product images in seconds.
            Boost your search rankings, improve accessibility, and save hours of manual work.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-3 text-lg"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/login')}
              className="px-8 py-3 text-lg"
            >
              Sign In
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Powerful Features for Modern E-commerce
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Everything you need to optimize your product images for search engines and accessibility
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Start free and scale as your business grows
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative bg-white/80 backdrop-blur-sm border-slate-200/60 ${plan.popular ? 'ring-2 ring-blue-500 shadow-xl' : 'hover:shadow-lg'} transition-all duration-300`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">Most Popular</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-bold text-slate-900">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-600">/{plan.period}</span>
                  </div>
                  <p className="text-slate-600 mt-2">{plan.description}</p>
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => plan.name === 'Enterprise' ? navigate('/contact') : navigate('/register')}
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Trusted by E-commerce Professionals
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              See how AltTextAI is helping businesses improve their SEO and accessibility
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-slate-200/60">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-4">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-600">{testimonial.role}</p>
                    <p className="text-sm text-slate-500">{testimonial.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              About AltTextAI
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              We're on a mission to make e-commerce more accessible and SEO-friendly through the power of AI
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Story</h3>
              <p className="text-slate-600 mb-6">
                Founded by e-commerce experts and AI specialists, AltTextAI was born from the frustration of manually writing alt text for thousands of product images. We saw an opportunity to combine cutting-edge AI technology with deep e-commerce knowledge to solve this problem.
              </p>
              <p className="text-slate-600 mb-6">
                Today, we're helping thousands of businesses improve their SEO rankings, meet accessibility standards, and save countless hours of manual work. Our AI understands context, recognizes products, and generates alt text that actually performs.
              </p>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">10K+</div>
                  <div className="text-sm text-slate-600">Images Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">500+</div>
                  <div className="text-sm text-slate-600">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">98%</div>
                  <div className="text-sm text-slate-600">Accuracy Rate</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                  <h4 className="font-semibold text-slate-900 mb-2">Expert Team</h4>
                  <p className="text-sm text-slate-600">AI specialists and e-commerce experts</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
                <CardContent className="p-6 text-center">
                  <Target className="w-8 h-8 text-green-600 mx-auto mb-4" />
                  <h4 className="font-semibold text-slate-900 mb-2">Proven Results</h4>
                  <p className="text-sm text-slate-600">40% average SEO improvement</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
                <CardContent className="p-6 text-center">
                  <Shield className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                  <h4 className="font-semibold text-slate-900 mb-2">Secure & Private</h4>
                  <p className="text-sm text-slate-600">Enterprise-grade security</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
                <CardContent className="p-6 text-center">
                  <Clock className="w-8 h-8 text-orange-600 mx-auto mb-4" />
                  <h4 className="font-semibold text-slate-900 mb-2">24/7 Support</h4>
                  <p className="text-sm text-slate-600">Always here to help</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Transform Your E-commerce SEO?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of businesses already using AltTextAI to improve their search rankings and accessibility
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/register')}
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg font-semibold"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/login')}
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg"
            >
              Sign In to Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-blue-400" />
                <span className="text-xl font-bold">AltTextAI</span>
              </div>
              <p className="text-slate-400">
                AI-powered alt text generation for modern e-commerce
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 AltTextAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}